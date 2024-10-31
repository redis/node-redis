import { CommandParser } from '../client/parser';
import { RedisArgument, BlobStringReply, NullReply, ArrayReply, TuplesReply, NumberReply, UnwrapReply, Command } from '../RESP/types';

type XPendingRawReply = TuplesReply<[
  pending: NumberReply,
  firstId: BlobStringReply | NullReply,
  lastId: BlobStringReply | NullReply,
  consumers: ArrayReply<TuplesReply<[
    name: BlobStringReply,
    deliveriesCounter: BlobStringReply
  ]>> | NullReply
]>;

export default {
  CACHEABLE: true,
  IS_READ_ONLY: true,
  parseCommand(parser: CommandParser, key: RedisArgument, group: RedisArgument) {
    parser.push('XPENDING');
    parser.pushKey(key);
    parser.push(group);
  },
  transformReply(reply: UnwrapReply<XPendingRawReply>) {
    const consumers = reply[3] as unknown as UnwrapReply<typeof reply[3]>;
    return {
      pending: reply[0],
      firstId: reply[1],
      lastId: reply[2],
      consumers: consumers === null ? null : consumers.map(consumer => {
        const [name, deliveriesCounter] = consumer as unknown as UnwrapReply<typeof consumer>;
        return {
          name,
          deliveriesCounter: Number(deliveriesCounter)
        };
      })
    }
  }
} as const satisfies Command;
