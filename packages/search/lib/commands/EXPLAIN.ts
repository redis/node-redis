import { RedisArgument, SimpleStringReply, Command } from '@redis/client/dist/lib/RESP/types';
import { FtSearchParams, pushParamsArgument } from './SEARCH';

export interface FtExplainOptions {
  PARAMS?: FtSearchParams;
  DIALECT?: number;
}

export default {
  FIRST_KEY_INDEX: undefined,
  IS_READ_ONLY: true,
  transformArguments(
    index: RedisArgument,
    query: RedisArgument,
    options?: FtExplainOptions
  ) {
    const args = ['FT.EXPLAIN', index, query];

    pushParamsArgument(args, options?.PARAMS);

    if (options?.DIALECT) {
      args.push('DIALECT', options.DIALECT.toString());
    }

    return args;
  },
  transformReply: undefined as unknown as () => SimpleStringReply
} as const satisfies Command;
