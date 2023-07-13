import { TuplesToMapReply, BlobStringReply, NumberReply, NullReply, Resp2Reply, Command, RespType, RESP_TYPES, RedisArgument } from '../RESP/types';
import { StreamMessageRawReply, transformStreamMessageReply } from './generic-transformers';

export type XInfoStreamReply = TuplesToMapReply<[
  [BlobStringReply<'length'>, NumberReply],
  [BlobStringReply<'radix-tree-keys'>, NumberReply],
  [BlobStringReply<'radix-tree-nodes'>, NumberReply],
  [BlobStringReply<'last-generated-id'>, BlobStringReply],
  /** added in 7.2 */
  [BlobStringReply<'max-deleted-entry-id'>, BlobStringReply],
  /** added in 7.2 */
  [BlobStringReply<'entries-added'>, NumberReply],
  /** added in 7.2 */
  [BlobStringReply<'recorded-first-entry-id'>, BlobStringReply],
  [BlobStringReply<'groups'>, NumberReply],
  [BlobStringReply<'first-entry'>, ReturnType<typeof transformStreamMessageReply> | NullReply],
  [BlobStringReply<'last-entry'>, ReturnType<typeof transformStreamMessageReply> | NullReply]
]>;

export default {
  FIRST_KEY_INDEX: 2,
  IS_READ_ONLY: true,
  transformArguments(key: RedisArgument) {
    return ['XINFO', 'STREAM', key];
  },
  transformReply: {
    // TODO: is there a "type safe" way to do it?
    2(reply: any) {
      const parsedReply: Partial<XInfoStreamReply['DEFAULT']> = {};

      for (let i = 0; i < reply.length; i += 2) {
        switch (reply[i]) {
          case 'first-entry':
          case 'last-entry':
            parsedReply[reply[i] as ('first-entry' | 'last-entry')] = transformEntry(reply[i + 1]) as any;
            break;

          default:
            parsedReply[reply[i] as keyof typeof parsedReply] = reply[i + 1];
            break;
        }
      }

      return parsedReply as XInfoStreamReply['DEFAULT'];
    },
    3(reply: any) {
      if (reply instanceof Map) {
        reply.set(
          'first-entry',
          transformEntry(reply.get('first-entry'))
        );
        reply.set(
          'last-entry',
          transformEntry(reply.get('last-entry'))
        );
      } else if (reply instanceof Array) {
        reply[17] = transformEntry(reply[17]);
        reply[19] = transformEntry(reply[19]);
      } else {
        reply['first-entry'] = transformEntry(reply['first-entry']);
        reply['last-entry'] = transformEntry(reply['last-entry']);
      }

      return reply as XInfoStreamReply;
    }
  }
} as const satisfies Command;

function transformEntry(entry: StreamMessageRawReply | NullReply) {
  return entry === null ? null : transformStreamMessageReply(entry as StreamMessageRawReply);
}
