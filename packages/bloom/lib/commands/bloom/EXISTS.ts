import { CommandParser } from '@redis/client/dist/lib/client/parser';
import { RedisArgument, Command } from '@redis/client/dist/lib/RESP/types';
import { transformBooleanReply } from '@redis/client/dist/lib/commands/generic-transformers';

export default {
  IS_READ_ONLY: true,
  /**
   * Checks if an item exists in a Bloom Filter
   * @param parser - The command parser
   * @param key - The name of the Bloom filter
   * @param item - The item to check for existence
   */
  parseCommand(parser: CommandParser, key: RedisArgument, item: RedisArgument) {
    parser.push('BF.EXISTS');
    parser.pushKey(key);
    parser.push(item);
  },
  transformReply: transformBooleanReply
} as const satisfies Command;
