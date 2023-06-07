import { CommandArguments, RedisScript, TransformReply } from './RESP/types';

// TODO: enum?
export type MULTI_REPLY = {
  GENERIC: 'generic';
  TYPED: 'typed';
};

export type MultiReply = MULTI_REPLY[keyof MULTI_REPLY];

export type MultiReplyType<T extends MultiReply, REPLIES> = T extends MULTI_REPLY['TYPED'] ? REPLIES : Array<unknown>;

export interface RedisMultiQueuedCommand {
  args: CommandArguments;
  transformReply?: TransformReply;
}

export default class RedisMultiCommand {
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
    return rawReplies.map((reply, i) => {
      const { transformReply, args } = this.queue[i];
      return transformReply ? transformReply(reply, args.preserve) : reply;
    });
  }
}
