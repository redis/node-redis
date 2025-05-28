import { CommandParser } from '@redis/client/dist/lib/client/parser';
import { RedisArgument, ArrayReply, NumberReply, DoubleReply, NullReply, BlobStringReply, UnwrapReply, Command } from '@redis/client/dist/lib/RESP/types';

export default {
  IS_READ_ONLY: false,
  /**
   * Increments a numeric value stored in a JSON document by a given number.
   * Returns the value after increment, or null if the key/path doesn't exist or value is not numeric.
   * 
   * @param parser - The Redis command parser
   * @param key - The key containing the JSON document
   * @param path - Path to the numeric value
   * @param by - Amount to increment by
   */
  parseCommand(parser: CommandParser, key: RedisArgument, path: RedisArgument, by: number) {
    parser.push('JSON.NUMINCRBY');
    parser.pushKey(key);
    parser.push(path, by.toString());
  },
  transformReply: {
    2: (reply: UnwrapReply<BlobStringReply>) => {
      return JSON.parse(reply.toString()) as number | Array<null | number>;
    },
    3: undefined as unknown as () => ArrayReply<NumberReply | DoubleReply | NullReply>
  }
} as const satisfies Command;
