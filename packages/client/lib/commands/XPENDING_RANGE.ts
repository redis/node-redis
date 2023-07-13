import { RedisArgument, ArrayReply, TuplesReply, BlobStringReply, NumberReply, UnwrapReply, Command } from '../RESP/types';

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
  transformReply(reply: UnwrapReply<XPendingRangeRawReply>) {
    return reply.map(pending => {
      const unwrapped = pending as unknown as UnwrapReply<typeof pending>;
      return {
        id: unwrapped[0],
        consumer: unwrapped[1],
        millisecondsSinceLastDelivery: unwrapped[2],
        deliveriesCounter: unwrapped[3]
      };
    });
  }
} as const satisfies Command;
