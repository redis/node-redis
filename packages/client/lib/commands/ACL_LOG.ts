import { CommandParser } from '../client/parser';
import { ArrayReply, TuplesToMapReply, BlobStringReply, NumberReply, DoubleReply, UnwrapReply, Resp2Reply, Command, TypeMapping } from '../RESP/types';
import { transformDoubleReply } from './generic-transformers';

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
  NOT_KEYED_COMMAND: true,
  IS_READ_ONLY: true,
  /**
   * Returns ACL security events log entries
   * @param parser - The Redis command parser
   * @param count - Optional maximum number of entries to return
   */
  parseCommand(parser: CommandParser, count?: number) {
    parser.push('ACL', 'LOG');
    if (count != undefined) {
      parser.push(count.toString());
    }
  },
  transformReply: {
    2: (reply: UnwrapReply<Resp2Reply<AclLogReply>>, preserve?: any, typeMapping?: TypeMapping) => {
      return reply.map(item => {
        const inferred = item as unknown as UnwrapReply<typeof item>;
        return {
          count: inferred[1],
          reason: inferred[3],
          context: inferred[5],
          object: inferred[7],
          username: inferred[9],
          'age-seconds': transformDoubleReply[2](inferred[11], preserve, typeMapping),
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
