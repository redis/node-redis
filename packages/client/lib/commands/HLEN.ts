import { CommandParser } from '../client/parser';
import { RedisArgument, NumberReply, Command } from '../RESP/types';

export default {
  CACHEABLE: true,
  IS_READ_ONLY: true,
  /**
   * Gets the number of fields in a hash.
   * @param parser - The Redis command parser.
   * @param key - Key of the hash.
   */
  parseCommand(parser: CommandParser, key: RedisArgument) {
    parser.push('HLEN');
    parser.pushKey(key);
  },
  transformReply: undefined as unknown as () => NumberReply
} as const satisfies Command;
