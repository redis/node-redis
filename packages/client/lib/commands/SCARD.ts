import { CommandParser } from '../client/parser';
import { RedisArgument, NumberReply, Command } from '../RESP/types';

export default {
  CACHEABLE: true,
  IS_READ_ONLY: true,
  /**
   * Constructs the SCARD command
   * 
   * @param parser - The command parser
   * @param key - The set key to get the cardinality of
   * @see https://redis.io/commands/scard/
   */
  parseCommand(parser: CommandParser, key: RedisArgument) {
    parser.push('SCARD');
    parser.pushKey(key);
  },
  transformReply: undefined as unknown as () => NumberReply
} as const satisfies Command;
