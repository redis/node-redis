import { RedisArgument, Command } from '@redis/client/dist/lib/RESP/types';
import AGGREGATE_WITHCURSOR from './AGGREGATE_WITHCURSOR';

export interface FtCursorReadOptions {
  COUNT?: number;
}

export default {
  FIRST_KEY_INDEX: undefined,
  IS_READ_ONLY: true,
  transformArguments(index: RedisArgument, cursor: RedisArgument, options?: FtCursorReadOptions) {
    const args = ['FT.CURSOR', 'READ', index, cursor];

    if (options?.COUNT !== undefined) {
      args.push('COUNT', options.COUNT.toString());
    }

    return args;
  },
  transformReply: AGGREGATE_WITHCURSOR.transformReply
} as const satisfies Command;
