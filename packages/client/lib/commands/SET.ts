import { RedisArgument, SimpleStringReply, BlobStringReply, NullReply, Command } from '../RESP/types';

type MaximumOneOf<T, K extends keyof T = keyof T> =
  K extends keyof T ? { [P in K]?: T[K] } & Partial<Record<Exclude<keyof T, K>, never>> : never;

type SetTTL = MaximumOneOf<{
  EX: number;
  PX: number;
  EXAT: number;
  PXAT: number;
  KEEPTTL: true;
}>;

type SetGuards = MaximumOneOf<{
  NX: true;
  XX: true;
}>;

interface SetCommonOptions {
  GET?: true;
}

export type SetOptions = SetTTL & SetGuards & SetCommonOptions;

export default {
  FIRST_KEY_INDEX: 1,
  transformArguments(key: RedisArgument, value: RedisArgument | number, options?: SetOptions) {
    const args = [
      'SET',
      key,
      typeof value === 'number' ? value.toString() : value
    ];

    if (options?.EX !== undefined) {
      args.push('EX', options.EX.toString());
    } else if (options?.PX !== undefined) {
      args.push('PX', options.PX.toString());
    } else if (options?.EXAT !== undefined) {
      args.push('EXAT', options.EXAT.toString());
    } else if (options?.PXAT !== undefined) {
      args.push('PXAT', options.PXAT.toString());
    } else if (options?.KEEPTTL) {
      args.push('KEEPTTL');
    }

    if (options?.NX) {
      args.push('NX');
    } else if (options?.XX) {
      args.push('XX');
    }

    if (options?.GET) {
      args.push('GET');
    }

    return args;
  },
  transformReply: undefined as unknown as () => SimpleStringReply<'OK'> | BlobStringReply | NullReply
} as const satisfies Command;
