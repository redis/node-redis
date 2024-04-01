import { fCallArguments } from "./commander";
import {
  ValkeyCommand,
  ValkeyCommandArguments,
  ValkeyCommandRawReply,
  ValkeyFunction,
  ValkeyScript,
} from "./commands";
import { ErrorReply, MultiErrorReply, WatchError } from "./errors";

export interface ValkeyMultiQueuedCommand {
  args: ValkeyCommandArguments;
  transformReply?: ValkeyCommand["transformReply"];
}

export default class ValkeyMultiCommand {
  static generateChainId(): symbol {
    return Symbol("ValkeyMultiCommand Chain Id");
  }

  readonly queue: Array<ValkeyMultiQueuedCommand> = [];

  readonly scriptsInUse = new Set<string>();

  addCommand(
    args: ValkeyCommandArguments,
    transformReply?: ValkeyCommand["transformReply"]
  ): void {
    this.queue.push({
      args,
      transformReply,
    });
  }

  addFunction(
    name: string,
    fn: ValkeyFunction,
    args: Array<unknown>
  ): ValkeyCommandArguments {
    const transformedArguments = fCallArguments(
      name,
      fn,
      fn.transformArguments(...args)
    );
    this.queue.push({
      args: transformedArguments,
      transformReply: fn.transformReply,
    });
    return transformedArguments;
  }

  addScript(
    script: ValkeyScript,
    args: Array<unknown>
  ): ValkeyCommandArguments {
    const transformedArguments: ValkeyCommandArguments = [];
    if (this.scriptsInUse.has(script.SHA1)) {
      transformedArguments.push("EVALSHA", script.SHA1);
    } else {
      this.scriptsInUse.add(script.SHA1);
      transformedArguments.push("EVAL", script.SCRIPT);
    }

    if (script.NUMBER_OF_KEYS !== undefined) {
      transformedArguments.push(script.NUMBER_OF_KEYS.toString());
    }

    const scriptArguments = script.transformArguments(...args);
    transformedArguments.push(...scriptArguments);
    if (scriptArguments.preserve) {
      transformedArguments.preserve = scriptArguments.preserve;
    }

    this.addCommand(transformedArguments, script.transformReply);

    return transformedArguments;
  }

  handleExecReplies(
    rawReplies: Array<ValkeyCommandRawReply | ErrorReply>
  ): Array<ValkeyCommandRawReply> {
    const execReply = rawReplies[
      rawReplies.length - 1
    ] as null | Array<ValkeyCommandRawReply>;
    if (execReply === null) {
      throw new WatchError();
    }

    return this.transformReplies(execReply);
  }

  transformReplies(
    rawReplies: Array<ValkeyCommandRawReply | ErrorReply>
  ): Array<ValkeyCommandRawReply> {
    const errorIndexes: Array<number> = [],
      replies = rawReplies.map((reply, i) => {
        if (reply instanceof ErrorReply) {
          errorIndexes.push(i);
          return reply;
        }
        const { transformReply, args } = this.queue[i];
        return transformReply ? transformReply(reply, args.preserve) : reply;
      });

    if (errorIndexes.length) throw new MultiErrorReply(replies, errorIndexes);
    return replies;
  }
}
