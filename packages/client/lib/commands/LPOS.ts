import { RedisArgument, NumberReply, NullReply, Command } from '../RESP/types';

export interface LPosOptions {
  RANK?: number;
  MAXLEN?: number;
}

export default {
  FIRST_KEY_INDEX: 1,
  IS_READ_ONLY: true,
  transformArguments(
    key: RedisArgument,
    element: RedisArgument,
    options?: LPosOptions
  ) {
    const args = ['LPOS', key, element];

    if (options) {
      if (typeof options.RANK === 'number') {
        args.push('RANK', options.RANK.toString());
      }

      if (typeof options.MAXLEN === 'number') {
        args.push('MAXLEN', options.MAXLEN.toString());
      }
    }

    return args;
  },
  transformReply: undefined as unknown as () => NumberReply | NullReply
} as const satisfies Command;
