import { CommandParser } from '../client/parser';
import { RedisArgument, NumberReply, Command } from '../RESP/types';

export default {
  IS_READ_ONLY: true,
  /**
   * Returns the absolute Unix timestamp (since January 1, 1970) at which the given key will expire
   * @param parser - The Redis command parser
   * @param key - Key to check expiration time
   */
  parseCommand(parser: CommandParser, key: RedisArgument) {
    parser.push('EXPIRETIME');
    parser.pushKey(key);
  },
  transformReply: undefined as unknown as () => NumberReply
} as const satisfies Command;
