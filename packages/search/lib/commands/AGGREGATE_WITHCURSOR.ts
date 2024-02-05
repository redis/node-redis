import { RedisArgument, Command } from '@redis/client/dist/lib/RESP/types';
import AGGREGATE, { FtAggregateOptions } from './AGGREGATE';

export interface FtAggregateWithCursorOptions extends FtAggregateOptions {
  COUNT?: number;
  MAXIDLE?: number;
}

export default {
  FIRST_KEY_INDEX: AGGREGATE.FIRST_KEY_INDEX,
  IS_READ_ONLY: AGGREGATE.IS_READ_ONLY,
  transformArguments(index: RedisArgument, query: RedisArgument, options?: FtAggregateWithCursorOptions) {
    const args = AGGREGATE.transformArguments(index, query, options);
    args.push('WITHCURSOR');

    if (options?.COUNT !== undefined) {
      args.push('COUNT', options.COUNT.toString());
    }

    if(options?.MAXIDLE !== undefined) {
      args.push('MAXIDLE', options.MAXIDLE.toString());
    }

    return args;
  },
  transformReply: undefined as unknown as () => any
} as const satisfies Command;

