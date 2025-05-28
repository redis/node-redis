import { CommandParser } from '@redis/client/dist/lib/client/parser';
import { RedisArgument, Command } from '@redis/client/dist/lib/RESP/types';
import { RedisVariadicArgument } from '@redis/client/dist/lib/commands/generic-transformers';
import { transformBooleanArrayReply } from '@redis/client/dist/lib/commands/generic-transformers';

export default {
  IS_READ_ONLY: false,
  /**
   * Adds multiple items to a Bloom Filter in a single call
   * @param parser - The command parser
   * @param key - The name of the Bloom filter
   * @param items - One or more items to add to the filter
   */
  parseCommand(parser: CommandParser, key: RedisArgument, items: RedisVariadicArgument) {
    parser.push('BF.MADD');
    parser.pushKey(key);
    parser.pushVariadic(items);
  },
  transformReply: transformBooleanArrayReply
} as const satisfies Command;
