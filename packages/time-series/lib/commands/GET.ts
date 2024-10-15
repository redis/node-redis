import { RedisArgument, TuplesReply, NumberReply, DoubleReply, UnwrapReply, Resp2Reply, Command } from '@redis/client/dist/lib/RESP/types';

export interface TsGetOptions {
  LATEST?: boolean;
}

export type TsGetReply = TuplesReply<[]> | TuplesReply<[NumberReply, DoubleReply]>;

export default {
  FIRST_KEY_INDEX: 1,
  IS_READ_ONLY: true,
  transformArguments(key: RedisArgument, options?: TsGetOptions) {
    const args = ['TS.GET', key];
    
    if (options?.LATEST) {
      args.push('LATEST');
    }

    return args;
  },
  transformReply: {
    2(reply: UnwrapReply<Resp2Reply<TsGetReply>>) {
      return reply.length === 0 ? null : {
        timestamp: reply[0],
        value: Number(reply[1])
      };
    },
    3(reply: UnwrapReply<TsGetReply>) {
      return reply.length === 0 ? null : {
        timestamp: reply[0],
        value: reply[1]
      };
    }
  }
} as const satisfies Command;
