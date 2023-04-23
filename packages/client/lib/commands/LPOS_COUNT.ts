import { RedisArgument, ArrayReply, NumberReply, Command } from '../RESP/types';
import LPOS, { LPosOptions } from './LPOS';

export default {
  FIRST_KEY_INDEX: LPOS.FIRST_KEY_INDEX,
  IS_READ_ONLY: LPOS.IS_READ_ONLY,
  transformArguments(
    key: RedisArgument,
    element: RedisArgument,
    count: number,
    options?: LPosOptions
  ) {
    const args = ['LPOS', key, element];

    if (typeof options?.RANK === 'number') {
      args.push('RANK', options.RANK.toString());
    }

    args.push('COUNT', count.toString());

    if (typeof options?.MAXLEN === 'number') {
      args.push('MAXLEN', options.MAXLEN.toString());
    }

    return args;
  },
  transformReply: undefined as unknown as () => ArrayReply<NumberReply>
} as const satisfies Command;
