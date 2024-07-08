import { RedisArgument, ArrayReply, NumberReply, Command } from '../RESP/types';
import { CommandParser } from '../client/parser';
import LPOS, { LPosOptions } from './LPOS';

export default {
  FIRST_KEY_INDEX: LPOS.FIRST_KEY_INDEX,
  IS_READ_ONLY: LPOS.IS_READ_ONLY,
  parseCommand(
    parser: CommandParser,
    key: RedisArgument,
    element: RedisArgument,
    count: number,
    options?: LPosOptions
  ) {
    parser.setCachable();
    parser.push('LPOS');
    parser.pushKey(key);
    parser.push(element);

    if (options?.RANK !== undefined) {
        parser.pushVariadic(['RANK', options.RANK.toString()]);
      }

      parser.pushVariadic(['COUNT', count.toString()]);

      if (options?.MAXLEN !== undefined) {
        parser.pushVariadic(['MAXLEN', options.MAXLEN.toString()]);
      }
  },
  transformArguments(
    key: RedisArgument,
    element: RedisArgument,
    count: number,
    options?: LPosOptions
  ) { return [] },
  transformReply: undefined as unknown as () => ArrayReply<NumberReply>
} as const satisfies Command;
