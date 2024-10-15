import { RedisArgument, SimpleStringReply, Command } from '../RESP/types';

export interface RestoreOptions {
  REPLACE?: boolean;
  ABSTTL?: boolean;
  IDLETIME?: number;
  FREQ?: number;
}

export default {
  FIRST_KEY_INDEX: 1,
  IS_READ_ONLY: false,
  transformArguments(
    key: RedisArgument,
    ttl: number,
    serializedValue: RedisArgument,
    options?: RestoreOptions
  ) {
    const args =  ['RESTORE', key, ttl.toString(), serializedValue];

    if (options?.REPLACE) {
      args.push('REPLACE');
    }

    if (options?.ABSTTL) {
      args.push('ABSTTL');
    }

    if (options?.IDLETIME) {
      args.push('IDLETIME', options.IDLETIME.toString());
    }

    if (options?.FREQ) {
      args.push('FREQ', options.FREQ.toString());
    }

    return args;
  },
  transformReply: undefined as unknown as () => SimpleStringReply<'OK'>
} as const satisfies Command;
