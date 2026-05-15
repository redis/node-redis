import { CommandParser } from '@redis/client/dist/lib/client/parser';
import { RedisArgument, Command, ReplyUnion, NumberReply, TypeMapping } from '@redis/client/dist/lib/RESP/types';
import AGGREGATE, { AggregateRawReply, AggregateReply, FtAggregateOptions } from './AGGREGATE';
import { getMapValue, mapLikeToObject } from './reply-transformers';

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

function transformAggregateWithCursorReplyResp3(
  reply: ReplyUnion,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- matches TransformReply contract
  preserve?: any,
  typeMapping?: TypeMapping
): AggregateWithCursorReply {
  if (Array.isArray(reply)) {
    return {
      ...(AGGREGATE.transformReply[3](reply[0] as ReplyUnion, preserve, typeMapping) as AggregateReply),
      cursor: reply[1] as NumberReply
    };
  }

  const mappedReply = mapLikeToObject(reply);
  const rawResult = getMapValue(mappedReply, ['results', 'result']) ?? mappedReply;

  return {
    ...(AGGREGATE.transformReply[3](rawResult as ReplyUnion, preserve, typeMapping) as AggregateReply),
    cursor: (getMapValue(mappedReply, ['cursor']) ?? 0) as NumberReply
  };
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
    2: (
      reply: AggregateWithCursorRawReply,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any -- matches TransformReply contract
      preserve?: any,
      typeMapping?: TypeMapping
    ): AggregateWithCursorReply => {
      return {
        ...AGGREGATE.transformReply[2](reply[0], preserve, typeMapping),
        cursor: reply[1]
      };
    },
    3: transformAggregateWithCursorReplyResp3
  },
} as const satisfies Command;
