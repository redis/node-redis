import { CommandParser } from '../client/parser';
import { RedisArgument, ArrayReply, NumberReply, Command } from '../RESP/types';
import LPOS, { LPosOptions } from './LPOS';

export default {
  CACHEABLE: LPOS.CACHEABLE,
  IS_READ_ONLY: LPOS.IS_READ_ONLY,
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
