import { RedisArgument, SimpleStringReply, Command } from '@redis/client/dist/lib/RESP/types';

export interface CfReserveOptions {
  BUCKETSIZE?: number;
  MAXITERATIONS?: number;
  EXPANSION?: number;
}

export default {
  FIRST_KEY_INDEX: 1,
  IS_READ_ONLY: false,
  transformArguments(
    key: RedisArgument,
    capacity: number,
    options?: CfReserveOptions
  ) {
    const args = ['CF.RESERVE', key, capacity.toString()];

    if (options?.BUCKETSIZE !== undefined) {
      args.push('BUCKETSIZE', options.BUCKETSIZE.toString());
    }

    if (options?.MAXITERATIONS !== undefined) {
      args.push('MAXITERATIONS', options.MAXITERATIONS.toString());
    }

    if (options?.EXPANSION !== undefined) {
      args.push('EXPANSION', options.EXPANSION.toString());
    }

    return args;
  },
  transformReply: undefined as unknown as () => SimpleStringReply<'OK'>
} as const satisfies Command;
