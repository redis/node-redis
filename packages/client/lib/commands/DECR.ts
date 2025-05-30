import { CommandParser } from '../client/parser';
import { RedisArgument, NumberReply, Command } from '../RESP/types';

export default {
  /**
   * Decrements the integer value of a key by one
   * @param parser - The Redis command parser
   * @param key - Key to decrement
   */
  parseCommand(parser: CommandParser, key: RedisArgument) {
    parser.push('DECR');
    parser.pushKey(key);
  },
  transformReply: undefined as unknown as () => NumberReply
} as const satisfies Command;
