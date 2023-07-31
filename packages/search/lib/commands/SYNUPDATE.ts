import { SimpleStringReply, Command, RedisArgument } from '@redis/client/dist/lib/RESP/types';
import { RedisVariadicArgument, pushVariadicArguments } from '@redis/client/dist/lib/commands/generic-transformers';

export interface FtSynUpdateOptions {
  SKIPINITIALSCAN?: boolean;
}

export default {
  FIRST_KEY_INDEX: undefined,
  IS_READ_ONLY: true,
  transformArguments(
    index: RedisArgument,
    groupId: RedisArgument,
    terms: RedisVariadicArgument,
    options?: FtSynUpdateOptions
  ) {
    const args = ['FT.SYNUPDATE', index, groupId];

    if (options?.SKIPINITIALSCAN) {
      args.push('SKIPINITIALSCAN');
    }

    return pushVariadicArguments(args, terms);
  },
  transformReply: undefined as unknown as () => SimpleStringReply<'OK'>
} as const satisfies Command;
