import { CommandParser } from '@redis/client/dist/lib/client/parser';
import { RedisArgument, NumberReply, Command } from '@redis/client/dist/lib/RESP/types';

export default {
  IS_READ_ONLY: true,
  /**
   * Returns the number of times an item appears in a Cuckoo Filter
   * @param parser - The command parser
   * @param key - The name of the Cuckoo filter
   * @param item - The item to count occurrences of
   */
  parseCommand(parser: CommandParser, key: RedisArgument, item: RedisArgument) {
    parser.push('CF.COUNT');
    parser.pushKey(key);
    parser.push(item);
  },
  transformReply: undefined as unknown as () => NumberReply
} as const satisfies Command;
