import { RedisArgument, NumberReply, NullReply, Command } from '../RESP/types';
import { CommandParser } from '../client/parser';

export interface LPosOptions {
  RANK?: number;
  MAXLEN?: number;
}

export default {
  FIRST_KEY_INDEX: 1,
  IS_READ_ONLY: true,
  parseCommand(
    parser: CommandParser,
    key: RedisArgument,
    element: RedisArgument,
    options?: LPosOptions
  ) {
    parser.setCachable();
    parser.push('LPOS');
    parser.pushKey(key);
    parser.push(element);

    if (options) {
      if (typeof options.RANK === 'number') {
        parser.pushVariadic(['RANK', options.RANK.toString()]);
      }

      if (typeof options.MAXLEN === 'number') {
        parser.pushVariadic(['MAXLEN', options.MAXLEN.toString()]);
      }
    }
  },
  transformArguments(
    key: RedisArgument,
    element: RedisArgument,
    options?: LPosOptions
  ) { return [] },
  transformReply: undefined as unknown as () => NumberReply | NullReply
} as const satisfies Command;
