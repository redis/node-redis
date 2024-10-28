import { CommandParser } from '../client/parser';
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
  CACHEABLE: true,
  IS_READ_ONLY: true,
  parseCommand(
    parser: CommandParser,
    key: RedisArgument,
    group: RedisArgument,
    start: RedisArgument,
    end: RedisArgument,
    count: number,
    options?: XPendingRangeOptions
  ) { 
    parser.push('XPENDING');
    parser.pushKey(key);
    parser.push(group);

    if (options?.IDLE !== undefined) {
      parser.push('IDLE', options.IDLE.toString());
    }

    parser.push(start, end, count.toString());

    if (options?.consumer) {
      parser.push(options.consumer);
    }
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
