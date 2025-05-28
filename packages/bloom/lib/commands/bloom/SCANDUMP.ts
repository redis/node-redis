import { CommandParser } from '@redis/client/dist/lib/client/parser';
import { RedisArgument, TuplesReply, NumberReply, BlobStringReply, UnwrapReply, Command } from '@redis/client/dist/lib/RESP/types';

export default {
  IS_READ_ONLY: true,
  /**
   * Begins an incremental save of a Bloom Filter. This is useful for large filters that can't be saved at once
   * @param parser - The command parser
   * @param key - The name of the Bloom filter to save
   * @param iterator - Iterator value; Start at 0, and use the iterator from the response for the next chunk
   */
  parseCommand(parser: CommandParser, key: RedisArgument, iterator: number) {
    parser.push('BF.SCANDUMP');
    parser.pushKey(key);
    parser.push(iterator.toString());
  },
  transformReply(reply: UnwrapReply<TuplesReply<[NumberReply, BlobStringReply]>>) {
    return {
      iterator: reply[0],
      chunk: reply[1]
    };
  }
} as const satisfies Command;
