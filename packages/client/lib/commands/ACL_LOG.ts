import { ArrayReply, TuplesToMapReply, BlobStringReply, NumberReply, DoubleReply, UnwrapReply, Resp2Reply, Command, SimpleStringReply } from '../RESP/types';

export type AclLogReply = ArrayReply<TuplesToMapReply<[
  [BlobStringReply<'count'>, NumberReply],
  [BlobStringReply<'reason'>, BlobStringReply],
  [BlobStringReply<'context'>, BlobStringReply],
  [BlobStringReply<'object'>, BlobStringReply],
  [BlobStringReply<'username'>, BlobStringReply],
  [BlobStringReply<'age-seconds'>, DoubleReply],
  [BlobStringReply<'client-info'>, BlobStringReply],
  /** added in 7.0 */
  [BlobStringReply<'entry-id'>, NumberReply],
  /** added in 7.0 */
  [BlobStringReply<'timestamp-created'>, NumberReply],
  /** added in 7.0 */
  [BlobStringReply<'timestamp-last-updated'>, NumberReply]
]>>;

export default {
  FIRST_KEY_INDEX: undefined,
  IS_READ_ONLY: true,
  transformArguments(count?: number) {
    const args = ['ACL', 'LOG'];

    if (count !== undefined) {
      args.push(count.toString());
    }

    return args;
  },
  transformReply: {
    2: (reply: UnwrapReply<Resp2Reply<AclLogReply>>) => {
      return reply.map(item => {
        const inferred = item as unknown as UnwrapReply<typeof item>;
        return {
          count: inferred[1],
          reason: inferred[3],
          context: inferred[5],
          object: inferred[7],
          username: inferred[9],
          'age-seconds': Number(inferred[11]),
          'client-info': inferred[13],
          'entry-id': inferred[15],
          'timestamp-created': inferred[17],
          'timestamp-last-updated': inferred[19]
        };
      })
    },
    3: undefined as unknown as () => AclLogReply
  }
} as const satisfies Command;
