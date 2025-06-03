import { CommandParser } from '../client/parser';
import { RedisArgument, NumberReply, Command } from '../RESP/types';

export default {
  /**
   * Increments the integer value of a field in a hash by the given number
   * @param parser - The Redis command parser
   * @param key - Key of the hash
   * @param field - Field to increment
   * @param increment - Increment amount
   */
  parseCommand(
    parser: CommandParser,
    key: RedisArgument,
    field: RedisArgument,
    increment: number
  ) {
    parser.push('HINCRBY');
    parser.pushKey(key);
    parser.push(field, increment.toString());
  },
  transformReply: undefined as unknown as () => NumberReply
} as const satisfies Command;
