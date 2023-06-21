import { DoubleReply, Resp2Reply } from '../RESP/types';
import { ArrayReply, BlobStringReply, Command, NumberReply, TuplesToMapReply } from '../RESP/types';

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
    2: (reply: Resp2Reply<AclLogReply>) => reply.map(item => ({
      count: item[1],
      reason: item[3],
      context: item[5],
      object: item[7],
      username: item[9],
      'age-seconds': Number(item[11]),
      'client-info': item[13],
      'entry-id': item[15],
      'timestamp-created': item[17],
      'timestamp-last-updated': item[19]
    })),
    3: undefined as unknown as () => AclLogReply
  }
} as const satisfies Command;
