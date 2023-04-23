import { Command, CommandArguments, RedisScript, TransformReply } from './RESP/types';
import { WatchError } from './errors';

export interface RedisMultiQueuedCommand {
  args: CommandArguments;
  transformReply?: TransformReply;
}

export default class RedisMultiCommand {
  static generateChainId(): symbol {
    return Symbol('RedisMultiCommand Chain Id');
  }

  readonly queue: Array<RedisMultiQueuedCommand> = [];

  readonly scriptsInUse = new Set<string>();

  addCommand(args: CommandArguments, transformReply?: TransformReply) {
    this.queue.push({
      args,
      transformReply
    });
    return this;
  }

  addScript(script: RedisScript, args: CommandArguments, transformReply?: TransformReply) {
    const redisArgs: CommandArguments = [];
    if (this.scriptsInUse.has(script.SHA1)) {
      redisArgs.push('EVALSHA', script.SHA1);
    } else {
      this.scriptsInUse.add(script.SHA1);
      redisArgs.push('EVAL', script.SCRIPT);
    }

    if (script.NUMBER_OF_KEYS !== undefined) {
      redisArgs.push(script.NUMBER_OF_KEYS.toString());
    }

    redisArgs.push(...args);
    redisArgs.preserve = args.preserve;

    return this.addCommand(redisArgs, transformReply);
  }
  
  handleExecReplies(rawReplies: Array<unknown>): Array<unknown> {
    const execReply = rawReplies[rawReplies.length - 1] as (null | Array<unknown>);
    if (execReply === null) {
      throw new WatchError();
    }

    return this.transformReplies(execReply);
  }

  transformReplies(rawReplies: Array<unknown>): Array<unknown> {
    return rawReplies.map((reply, i) => {
      const { transformReply, args } = this.queue[i];
      return transformReply ? transformReply(reply, args.preserve) : reply;
    });
  }
}
