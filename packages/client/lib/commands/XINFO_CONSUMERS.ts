import { RedisArgument, ArrayReply, TuplesToMapReply, BlobStringReply, NumberReply, Resp2Reply, Command } from '../RESP/types';

export type XInfoConsumersReply = ArrayReply<TuplesToMapReply<[
  [BlobStringReply<'name'>, BlobStringReply],
  [BlobStringReply<'pending'>, NumberReply],
  [BlobStringReply<'idle'>, NumberReply],
  /** added in 7.2 */
  [BlobStringReply<'inactive'>, NumberReply]
]>>;

export default {
  FIRST_KEY_INDEX: 2,
  IS_READ_ONLY: true,
  transformArguments(
    key: RedisArgument,
    group: RedisArgument
  ) {
    return ['XINFO', 'CONSUMERS', key, group];
  },
  transformReply: {
    2: (reply: Resp2Reply<XInfoConsumersReply>) => {
      return reply.map(consumer => ({
        name: consumer[1],
        pending: consumer[3],
        idle: consumer[5],
        inactive: consumer[7]
      }));
    },
    3: undefined as unknown as () => XInfoConsumersReply
  }
} as const satisfies Command;
