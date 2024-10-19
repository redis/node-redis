import { CommandParser } from '@redis/client/lib/client/parser';
import { RedisArgument, ArrayReply, BlobStringReply, NumberReply, UnwrapReply, Command } from '@redis/client/lib/RESP/types';

export default {
  IS_READ_ONLY: true,
  parseCommand(parser: CommandParser, key: RedisArgument) {
    parser.push('TOPK.LIST');
    parser.pushKey(key);
    parser.push('WITHCOUNT');
  },
  transformReply(rawReply: UnwrapReply<ArrayReply<BlobStringReply | NumberReply>>) {
    const reply: Array<{
      item: BlobStringReply;
      count: NumberReply;
    }> = [];
    
    for (let i = 0; i < rawReply.length; i++) {
      reply.push({
        item: rawReply[i] as BlobStringReply,
        count: rawReply[++i] as NumberReply
      });
    }

    return reply;
  }
} as const satisfies Command;
