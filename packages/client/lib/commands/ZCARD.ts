import { CommandParser } from '../client/parser';
import { RedisArgument, NumberReply, Command } from '../RESP/types';

/**
 * Command for getting the number of members in a sorted set
 */
export default {
  CACHEABLE: true,
  IS_READ_ONLY: true,
  /**
   * Constructs the ZCARD command to get the cardinality (number of members) of a sorted set
   *
   * @param parser - The command parser
   * @param key - The sorted set key
   * @returns Number of members in the sorted set
   * @see https://redis.io/commands/zcard/
   */
  parseCommand(parser: CommandParser, key: RedisArgument) {
    parser.push('ZCARD');
    parser.pushKey(key);
  },
  transformReply: undefined as unknown as () => NumberReply
} as const satisfies Command;
