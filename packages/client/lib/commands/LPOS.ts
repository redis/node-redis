import { CommandParser } from '../client/parser';
import { RedisArgument, NumberReply, NullReply, Command } from '../RESP/types';

export interface LPosOptions {
  RANK?: number;
  MAXLEN?: number;
}

export default {
  CACHEABLE: true,
  IS_READ_ONLY: true,
  parseCommand(
    parser: CommandParser,
    key: RedisArgument,
    element: RedisArgument,
    options?: LPosOptions
  ) {
    parser.push('LPOS');
    parser.pushKey(key);
    parser.push(element);

    if (options?.RANK !== undefined) {
      parser.push('RANK', options.RANK.toString());
    }

    if (options?.MAXLEN !== undefined) {
      parser.push('MAXLEN', options.MAXLEN.toString());
    }
  },
  transformReply: undefined as unknown as () => NumberReply | NullReply
} as const satisfies Command;
