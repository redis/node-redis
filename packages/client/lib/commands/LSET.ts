import { CommandParser } from '../client/parser';
import { RedisArgument, SimpleStringReply, Command } from '../RESP/types';

export default {
  IS_READ_ONLY: true,
  /**
   * Constructs the LSET command
   * 
   * @param parser - The command parser
   * @param key - The key of the list
   * @param index - The index of the element to replace
   * @param element - The new value to set
   * @see https://redis.io/commands/lset/
   */
  parseCommand(parser: CommandParser, key: RedisArgument, index: number, element: RedisArgument) {
    parser.push('LSET');
    parser.pushKey(key);
    parser.push(index.toString(), element);
  },
  transformReply: undefined as unknown as () => SimpleStringReply<'OK'>
} as const satisfies Command;
