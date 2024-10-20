import { CommandParser } from '@redis/client/lib/client/parser';
import { RedisArgument, Command, ReplyUnion, NumberReply } from '@redis/client/lib/RESP/types';
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
  IS_READ_ONLY: AGGREGATE.IS_READ_ONLY,
  parseCommand(parser: CommandParser, index: RedisArgument, query: RedisArgument, options?: FtAggregateWithCursorOptions) {
    AGGREGATE.parseCommand(parser, index, query, options);
    parser.push('WITHCURSOR');

    if (options?.COUNT !== undefined) {
      parser.push('COUNT', options.COUNT.toString());
    }

    if(options?.MAXIDLE !== undefined) {
      parser.push('MAXIDLE', options.MAXIDLE.toString());
    }
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
