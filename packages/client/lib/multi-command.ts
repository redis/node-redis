import { CommandArguments, RedisScript, ReplyUnion, TransformReply, TypeMapping } from './RESP/types';
import { ErrorReply, MultiErrorReply } from './errors';

export type MULTI_REPLY = {
  GENERIC: 'generic';
  TYPED: 'typed';
};

export type MultiReply = MULTI_REPLY[keyof MULTI_REPLY];

export type MultiReplyType<T extends MultiReply, REPLIES> = T extends MULTI_REPLY['TYPED'] ? REPLIES : Array<ReplyUnion>;

export interface RedisMultiQueuedCommand {
  args: CommandArguments;
  transformReply?: TransformReply;
}

export default class RedisMultiCommand {
  readonly typeMapping?: TypeMapping;

  constructor(typeMapping?: TypeMapping) {
    this.typeMapping = typeMapping;
  }

  readonly queue: Array<RedisMultiQueuedCommand> = [];

  readonly scriptsInUse = new Set<string>();

  addCommand(args: CommandArguments, transformReply?: TransformReply) {
    this.queue.push({
      args,
      transformReply
    });
  }

  addScript(script: RedisScript, args: CommandArguments, transformReply?: TransformReply) {
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

    this.addCommand(redisArgs, transformReply);
  }
  
  transformReplies(rawReplies: Array<unknown>): Array<unknown> {
    const errorIndexes: Array<number> = [],
      replies = rawReplies.map((reply, i) => {
        if (reply instanceof ErrorReply) {
          errorIndexes.push(i);
          return reply;
        }

        const { transformReply, args } = this.queue[i];
        return transformReply ? transformReply(reply, args.preserve, this.typeMapping) : reply;
      });

    if (errorIndexes.length) throw new MultiErrorReply(replies, errorIndexes);
    return replies;
  }
}
