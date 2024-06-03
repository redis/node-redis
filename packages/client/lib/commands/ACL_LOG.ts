import { ArrayReply, TuplesToMapReply, BlobStringReply, NumberReply, DoubleReply, UnwrapReply, Resp2Reply, Command, SimpleStringReply } from '../RESP/types';

export type AclLogReply = ArrayReply<TuplesToMapReply<[
  [SimpleStringReply<'count'>, NumberReply],
  [SimpleStringReply<'reason'>, BlobStringReply],
  [SimpleStringReply<'context'>, BlobStringReply],
  [SimpleStringReply<'object'>, BlobStringReply],
  [SimpleStringReply<'username'>, BlobStringReply],
  [SimpleStringReply<'age-seconds'>, DoubleReply],
  [SimpleStringReply<'client-info'>, BlobStringReply],
  /** added in 7.0 */
  [SimpleStringReply<'entry-id'>, NumberReply],
  /** added in 7.0 */
  [SimpleStringReply<'timestamp-created'>, NumberReply],
  /** added in 7.0 */
  [SimpleStringReply<'timestamp-last-updated'>, NumberReply]
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
