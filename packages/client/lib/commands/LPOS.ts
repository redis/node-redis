import { CommandParser } from '../client/parser';
import { RedisArgument, NumberReply, NullReply,ArrayReply, Command } from '../RESP/types';

export interface LPosOptions {
  RANK?: number;
  MAXLEN?: number;
  COUNT?: number;
}

export default {
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
    if (options?.COUNT !== undefined) {
      parser.push('COUNT', options.COUNT.toString());
    }
    if (options?.MAXLEN !== undefined) {
      parser.push('MAXLEN', options.MAXLEN.toString());
    }
  },
  transformReply: undefined as unknown as () => NumberReply | NullReply
} as const satisfies Command;
