import { NullReply, ArrayReply, BlobStringReply, Command, RedisArgument } from '@redis/client/dist/lib/RESP/types';

export interface FtSugGetOptions {
  FUZZY?: boolean;
  MAX?: number;
}

export default {
  FIRST_KEY_INDEX: 1,
  IS_READ_ONLY: true,
  transformArguments(key: RedisArgument, prefix: RedisArgument, options?: FtSugGetOptions) {
    const args = ['FT.SUGGET', key, prefix];

    if (options?.FUZZY) {
      args.push('FUZZY');
    }

    if (options?.MAX !== undefined) {
      args.push('MAX', options.MAX.toString());
    }

    return args;
  },
  transformReply: undefined as unknown as () => NullReply | ArrayReply<BlobStringReply>
} as const satisfies Command;
