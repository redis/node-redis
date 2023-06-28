// import { RedisCommandArgument, RedisCommandArguments } from '.';

// export const FIRST_KEY_INDEX = 1;

// export const IS_READ_ONLY = true;

// interface XPendingRangeOptions {
//     IDLE?: number;
//     consumer?: RedisCommandArgument;
// }

// export function transformArguments(
//     key: RedisCommandArgument,
//     group: RedisCommandArgument,
//     start: string,
//     end: string,
//     count: number,
//     options?: XPendingRangeOptions
// ): RedisCommandArguments {
//     const args = ['XPENDING', key, group];

//     if (options?.IDLE) {
//         args.push('IDLE', options.IDLE.toString());
//     }

//     args.push(start, end, count.toString());

//     if (options?.consumer) {
//         args.push(options.consumer);
//     }

//     return args;
// }



// export function transformReply(reply: XPendingRangeRawReply): XPendingRangeReply {
//     return reply.map(([id, owner, millisecondsSinceLastDelivery, deliveriesCounter]) => ({
//         id,
//         owner,
//         millisecondsSinceLastDelivery,
//         deliveriesCounter
//     }));
// }

import { RedisArgument, ArrayReply, TuplesReply, BlobStringReply, NumberReply, Command } from '../RESP/types';

export interface XPendingRangeOptions {
  IDLE?: number;
  consumer?: RedisArgument;
}

type XPendingRangeRawReply = ArrayReply<TuplesReply<[
  id: BlobStringReply,
  consumer: BlobStringReply,
  millisecondsSinceLastDelivery: NumberReply,
  deliveriesCounter: NumberReply
]>>;

export default {
  FIRST_KEY_INDEX: 1,
  IS_READ_ONLY: true,
  transformArguments(
    key: RedisArgument,
    group: RedisArgument,
    start: RedisArgument,
    end: RedisArgument,
    count: number,
    options?: XPendingRangeOptions
  ) {
    const args = ['XPENDING', key, group];

    if (options?.IDLE !== undefined) {
      args.push('IDLE', options.IDLE.toString());
    }

    args.push(
      start,
      end,
      count.toString()
    );

    if (options?.consumer) {
      args.push(options.consumer);
    }

    return args;
  },
  transformReply(reply: XPendingRangeRawReply) {
    return reply.map(pending => ({
      id: pending[0],
      consumer: pending[1],
      millisecondsSinceLastDelivery: pending[2],
      deliveriesCounter: pending[3]
    }));
  }
} as const satisfies Command;
