import { CommandParser } from '../client/parser';
import { RedisArgument, NumberReply, Command } from '../RESP/types';

type LInsertPosition = 'BEFORE' | 'AFTER';

export default {
  IS_READ_ONLY: true,
  /**
   * Constructs the LINSERT command
   * 
   * @param parser - The command parser
   * @param key - The key of the list
   * @param position - The position where to insert (BEFORE or AFTER)
   * @param pivot - The element to find in the list
   * @param element - The element to insert
   * @see https://redis.io/commands/linsert/
   */
  parseCommand(
    parser: CommandParser,
    key: RedisArgument,
    position: LInsertPosition,
    pivot: RedisArgument,
    element: RedisArgument
  ) {
    parser.push('LINSERT');
    parser.pushKey(key);
    parser.push(position, pivot, element);
  },
  transformReply: undefined as unknown as () => NumberReply
} as const satisfies Command;
