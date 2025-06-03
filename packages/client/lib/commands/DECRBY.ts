import { CommandParser } from '../client/parser';
import { RedisArgument, NumberReply, Command } from '../RESP/types';

export default {
  /**
   * Decrements the integer value of a key by the given number
   * @param parser - The Redis command parser
   * @param key - Key to decrement
   * @param decrement - Decrement amount
   */
  parseCommand(parser: CommandParser, key: RedisArgument, decrement: number) {
    parser.push('DECRBY');
    parser.pushKey(key);
    parser.push(decrement.toString());
  },
  transformReply: undefined as unknown as () => NumberReply
} as const satisfies Command;
