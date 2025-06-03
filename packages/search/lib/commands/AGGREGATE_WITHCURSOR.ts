import { CommandParser } from '@redis/client/dist/lib/client/parser';
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
  IS_READ_ONLY: AGGREGATE.IS_READ_ONLY,
  /**
   * Performs an aggregation with a cursor for retrieving large result sets.
   * @param parser - The command parser
   * @param index - Name of the index to query
   * @param query - The aggregation query
   * @param options - Optional parameters:
   *   - All options supported by FT.AGGREGATE
   *   - COUNT: Number of results to return per cursor fetch
   *   - MAXIDLE: Maximum idle time for cursor in milliseconds
   */
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
