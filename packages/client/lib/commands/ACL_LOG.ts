import { Resp2Reply } from '../RESP/types';
import { ArrayReply, BlobStringReply, Command, NumberReply, TuplesToMapReply } from '../RESP/types';

export type AclLogReply = ArrayReply<TuplesToMapReply<[
  [BlobStringReply<'count'>, NumberReply],
  [BlobStringReply<'reason'>, BlobStringReply],
  [BlobStringReply<'context'>, BlobStringReply],
  [BlobStringReply<'object'>, BlobStringReply],
  [BlobStringReply<'username'>, BlobStringReply],
  [BlobStringReply<'age-seconds'>, BlobStringReply],
  [BlobStringReply<'client-info'>, BlobStringReply]
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
    2: (reply: Resp2Reply<AclLogReply>) => ({
      count: Number(reply[1]),
      reason: reply[3],
      context: reply[5],
      object: reply[7],
      username: reply[9],
      'age-seconds': Number(reply[11]),
      'client-info': reply[13]
    }),
    3: undefined as unknown as () => AclLogReply
  }
} as const satisfies Command;
