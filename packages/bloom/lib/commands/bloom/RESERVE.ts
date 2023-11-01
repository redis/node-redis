import { RedisArgument, SimpleStringReply, Command } from '@redis/client/dist/lib/RESP/types';

export interface BfReserveOptions {
  EXPANSION?: number;
  NONSCALING?: boolean;
}

export default {
  FIRST_KEY_INDEX: 1,
  IS_READ_ONLY: true,
  transformArguments(
    key: RedisArgument,
    errorRate: number,
    capacity: number,
    options?: BfReserveOptions
  ) {
    const args = ['BF.RESERVE', key, errorRate.toString(), capacity.toString()];

    if (options?.EXPANSION) {
        args.push('EXPANSION', options.EXPANSION.toString());
    }

    if (options?.NONSCALING) {
        args.push('NONSCALING');
    }

    return args;
  },
  transformReply: undefined as unknown as () => SimpleStringReply<'OK'>
} as const satisfies Command;
