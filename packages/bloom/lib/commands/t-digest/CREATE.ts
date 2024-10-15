import { RedisArgument, SimpleStringReply, Command } from '@redis/client/dist/lib/RESP/types';

export interface TDigestCreateOptions {
  COMPRESSION?: number;
}

export default {
  FIRST_KEY_INDEX: 1,
  IS_READ_ONLY: false,
  transformArguments(key: RedisArgument, options?: TDigestCreateOptions) {
    const args = ['TDIGEST.CREATE', key];
    
    if (options?.COMPRESSION !== undefined) {
      args.push('COMPRESSION', options.COMPRESSION.toString());
    }

    return args;
  },
  transformReply: undefined as unknown as () => SimpleStringReply<'OK'>
} as const satisfies Command;
