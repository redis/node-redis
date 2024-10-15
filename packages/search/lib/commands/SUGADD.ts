import { RedisArgument, NumberReply, Command } from '@redis/client/dist/lib/RESP/types';

export interface FtSugAddOptions {
  INCR?: boolean;
  PAYLOAD?: RedisArgument;
}

export default {
  FIRST_KEY_INDEX: 1,
  IS_READ_ONLY: true,
  transformArguments(key: RedisArgument, string: RedisArgument, score: number, options?: FtSugAddOptions) {
    const args = ['FT.SUGADD', key, string, score.toString()];

    if (options?.INCR) {
      args.push('INCR');
    }

    if (options?.PAYLOAD) {
      args.push('PAYLOAD', options.PAYLOAD);
    }

    return args;
  },
  transformReply: undefined as unknown as () => NumberReply
} as const satisfies Command;
