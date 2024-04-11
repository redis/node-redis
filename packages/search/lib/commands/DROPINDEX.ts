import { RedisArgument, SimpleStringReply, NumberReply, Command } from '@redis/client/dist/lib/RESP/types';

export interface FtDropIndexOptions {
  DD?: true;
}

export default {
  FIRST_KEY_INDEX: undefined,
  IS_READ_ONLY: true,
  transformArguments(index: RedisArgument, options?: FtDropIndexOptions) {
    const args = ['FT.DROPINDEX', index];

    if (options?.DD) {
      args.push('DD');
    }

    return args;
  },
  transformReply: {
    2: undefined as unknown as () => SimpleStringReply<'OK'>,
    3: undefined as unknown as () => NumberReply
  }
} as const satisfies Command;
