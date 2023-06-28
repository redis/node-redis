import { RedisArgument, ArrayReply, TuplesToMapReply, BlobStringReply, NumberReply, Resp2Reply, Command, NullReply } from '../RESP/types';

export type XInfoGroupsReply = ArrayReply<TuplesToMapReply<[
  [BlobStringReply<'name'>, BlobStringReply],
  [BlobStringReply<'consumers'>, NumberReply],
  [BlobStringReply<'pending'>, NumberReply],
  [BlobStringReply<'last-delivered-id'>, NumberReply],
  /** added in 7.0 */
  [BlobStringReply<'entries-read'>, NumberReply | NullReply],
  /** added in 7.0 */
  [BlobStringReply<'lag'>, NumberReply],
]>>;

export default {
  FIRST_KEY_INDEX: 2,
  IS_READ_ONLY: true,
  transformArguments(key: RedisArgument) {
    return ['XINFO', 'GROUPS', key];
  },
  transformReply: {
    2: (reply: Resp2Reply<XInfoGroupsReply>) => {
      return reply.map(group => ({
        name: group[1],
        consumers: group[3],
        pending: group[5],
        'last-delivered-id': group[7],
        'entries-read': group[9],
        lag: group[11]
      }));
    },
    3: undefined as unknown as () => XInfoGroupsReply
  }
} as const satisfies Command;
