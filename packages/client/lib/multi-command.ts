import { CommandArguments, RedisScript, ReplyUnion, TransformReply } from './RESP/types';
import { ErrorReply, MultiErrorReply } from './errors';

export type MULTI_REPLY = {
  GENERIC: 'generic';
  TYPED: 'typed';
};

export type MultiReply = MULTI_REPLY[keyof MULTI_REPLY];

export type MultiReplyType<T extends MultiReply, REPLIES> = T extends MULTI_REPLY['TYPED'] ? REPLIES : Array<ReplyUnion>;

export interface RedisMultiQueuedCommand {
  args: CommandArguments;
  ignoreTypeMapping?: boolean;
  transformReply?: TransformReply;
}

export default class RedisMultiCommand {
  readonly queue: Array<RedisMultiQueuedCommand> = [];

  readonly scriptsInUse = new Set<string>();

  addCommand(args: CommandArguments, ignoreTypeMapping?: boolean, transformReply?: TransformReply) {
    this.queue.push({
      args,
      ignoreTypeMapping,
      transformReply
    });
  }

  addScript(script: RedisScript, args: CommandArguments, ignoreTypeMapping?: boolean, transformReply?: TransformReply) {
    const redisArgs: CommandArguments = [];
    redisArgs.preserve = args.preserve;
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

    this.addCommand(redisArgs, ignoreTypeMapping, transformReply);
  }
  
  transformReplies(rawReplies: Array<unknown>): Array<unknown> {
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
