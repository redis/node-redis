import { CommandParser } from '../client/parser';
import { RedisArgument, NumberReply, Command } from '../RESP/types';

export default {
  CACHEABLE: true,
  IS_READ_ONLY: true,
  /**
   * Determines whether a field exists in a hash
   * @param parser - The Redis command parser
   * @param key - Key of the hash
   * @param field - Field to check
   */
  parseCommand(parser: CommandParser, key: RedisArgument, field: RedisArgument) {
    parser.push('HEXISTS');
    parser.pushKey(key);
    parser.push(field);
  },
  transformReply: undefined as unknown as () => NumberReply<0 | 1>
} as const satisfies Command;
