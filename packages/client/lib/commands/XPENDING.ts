import { RedisArgument, BlobStringReply, NullReply, TuplesReply, NumberReply, Command, ArrayReply } from '../RESP/types';

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
  FIRST_KEY_INDEX: 1,
  IS_READ_ONLY: true,
  transformArguments(key: RedisArgument, group: RedisArgument) {
    return ['XPENDING', key, group];
  },
  transformReply(reply: XPendingRawReply) {
    return {
      pending: reply[0],
      firstId: reply[1],
      lastId: reply[2],
      consumers: reply[3] === null ? null : reply[3].map(([name, deliveriesCounter]) => ({
        name,
        deliveriesCounter: Number(deliveriesCounter)
      }))
    }
  }
} as const satisfies Command;
