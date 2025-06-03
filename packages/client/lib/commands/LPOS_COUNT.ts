import { CommandParser } from '../client/parser';
import { RedisArgument, ArrayReply, NumberReply, Command } from '../RESP/types';
import LPOS, { LPosOptions } from './LPOS';

export default {
  CACHEABLE: LPOS.CACHEABLE,
  IS_READ_ONLY: LPOS.IS_READ_ONLY,
  /**
   * Constructs the LPOS command with COUNT option
   * 
   * @param parser - The command parser
   * @param key - The key of the list
   * @param element - The element to search for
   * @param count - The number of positions to return
   * @param options - Optional parameters for RANK and MAXLEN
   * @see https://redis.io/commands/lpos/
   */
  parseCommand(
    parser: CommandParser,
    key: RedisArgument,
    element: RedisArgument,
    count: number,
    options?: LPosOptions
  ) {
    LPOS.parseCommand(parser, key, element, options);

    parser.push('COUNT', count.toString());
  },
  transformReply: undefined as unknown as () => ArrayReply<NumberReply>
} as const satisfies Command;
