// import {
//     AggregateOptions,
//     AggregateRawReply,
//     AggregateReply,
//     transformArguments as transformAggregateArguments,
//     transformReply as transformAggregateReply
// } from './AGGREGATE';

// export { FIRST_KEY_INDEX, IS_READ_ONLY } from './AGGREGATE';

// interface AggregateWithCursorOptions extends AggregateOptions {
//     COUNT?: number;
// }

// export function transformArguments(
//     index: string,
//     query: string,
//     options?: AggregateWithCursorOptions
// ) {
//     const args = transformAggregateArguments(index, query, options);

//     args.push('WITHCURSOR');
//     if (options?.COUNT) {
//         args.push('COUNT', options.COUNT.toString());
//     }

//     return args;
// }

// type AggregateWithCursorRawReply = [
//     result: AggregateRawReply,
//     cursor: number
// ];

// interface AggregateWithCursorReply extends AggregateReply {
//     cursor: number;
// }

// export function transformReply(reply: AggregateWithCursorRawReply): AggregateWithCursorReply {
//     return {
//         ...transformAggregateReply(reply[0]),
//         cursor: reply[1]
//     };
// }

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

