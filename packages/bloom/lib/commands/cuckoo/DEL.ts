import { CommandParser } from '@redis/client/dist/lib/client/parser';
import { RedisArgument, Command } from '@redis/client/dist/lib/RESP/types';
import { transformBooleanReply } from '@redis/client/dist/lib/commands/generic-transformers';

export default {
  IS_READ_ONLY: false,
  /**
   * Removes an item from a Cuckoo Filter if it exists
   * @param parser - The command parser
   * @param key - The name of the Cuckoo filter
   * @param item - The item to remove from the filter
   */
  parseCommand(parser: CommandParser, key: RedisArgument, item: RedisArgument) {
    parser.push('CF.DEL');
    parser.pushKey(key);
    parser.push(item);
  },
  transformReply: transformBooleanReply
} as const satisfies Command;
