import { RedisArgument, Command, ReplyUnion, NumberReply } from '@redis/client/dist/lib/RESP/types';
import AGGREGATE, { AggregateRawReply, AggregateReply, FtAggregateOptions } from './AGGREGATE';

export interface FtAggregateWithCursorOptions extends FtAggregateOptions {
  COUNT?: number;
  MAXIDLE?: number;
}


type AggregateWithCursorRawReply = [
  result: AggregateRawReply,
  cursor: NumberReply
];

export interface AggregateWithCursorReply extends AggregateReply {
  cursor: NumberReply;
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
  transformReply: {
    2: (reply: AggregateWithCursorRawReply): AggregateWithCursorReply => {
      return {
        ...AGGREGATE.transformReply[2](reply[0]),
        cursor: reply[1]
      };
    },
    3: undefined as unknown as () => ReplyUnion
  },
  unstableResp3: true
} as const satisfies Command;

