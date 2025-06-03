import { CommandParser } from '@redis/client/dist/lib/client/parser';
import { RedisArgument, NumberReply, Command } from '@redis/client/dist/lib/RESP/types';

export default {
  IS_READ_ONLY: true,
  /**
   * Returns the cardinality (number of items) in a Bloom Filter
   * @param parser - The command parser
   * @param key - The name of the Bloom filter to query
   */
  parseCommand(parser: CommandParser, key: RedisArgument) {
    parser.push('BF.CARD');
    parser.pushKey(key);
  },
  transformReply: undefined as unknown as () => NumberReply
} as const satisfies Command;
