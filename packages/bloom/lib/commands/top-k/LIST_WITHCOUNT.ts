import { CommandParser } from '@redis/client/dist/lib/client/parser';
import { RedisArgument, ArrayReply, BlobStringReply, NumberReply, UnwrapReply, Command } from '@redis/client/dist/lib/RESP/types';

export default {
  IS_READ_ONLY: true,
  /**
   * Returns all items in a Top-K filter with their respective counts
   * @param parser - The command parser
   * @param key - The name of the Top-K filter
   */
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
