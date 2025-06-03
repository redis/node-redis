import { CommandParser } from '../client/parser';
import { RedisArgument, NumberReply, Command } from '../RESP/types';

export default {
  IS_READ_ONLY: true,
  /**
   * Constructs the LREM command
   * 
   * @param parser - The command parser
   * @param key - The key of the list
   * @param count - The count of elements to remove (negative: from tail to head, 0: all occurrences, positive: from head to tail)
   * @param element - The element to remove
   * @see https://redis.io/commands/lrem/
   */
  parseCommand(parser: CommandParser, key: RedisArgument, count: number, element: RedisArgument) {
    parser.push('LREM');
    parser.pushKey(key);
    parser.push(count.toString());
    parser.push(element);
  },
  transformReply: undefined as unknown as () => NumberReply
} as const satisfies Command;
