import { TuplesToMapReply, BlobStringReply, NumberReply, NullReply, Resp2Reply, Command, RespType, RESP_TYPES, RedisArgument } from '../RESP/types';
import { StreamMessageRawReply, transformStreamMessageReply } from './generic-transformers';

export type XInfoStreamRawReply = TuplesToMapReply<[
  [BlobStringReply<'length'>, NumberReply],
  [BlobStringReply<'radix-tree-keys'>, NumberReply],
  [BlobStringReply<'radix-tree-nodes'>, NumberReply],
  [BlobStringReply<'last-generated-id'>, BlobStringReply],
  [BlobStringReply<'max-deleted-entry-id'>, BlobStringReply],
  [BlobStringReply<'entries-added'>, NumberReply],
  [BlobStringReply<'recorded-first-entry-id'>, BlobStringReply],
  [BlobStringReply<'groups'>, NumberReply],
  [BlobStringReply<'first-entry'>, StreamMessageRawReply | NullReply],
  [BlobStringReply<'last-entry'>, StreamMessageRawReply | NullReply]
]>;

export type XInfoStreamReply = TuplesToMapReply<[
  [BlobStringReply<'length'>, NumberReply],
  [BlobStringReply<'radix-tree-keys'>, NumberReply],
  [BlobStringReply<'radix-tree-nodes'>, NumberReply],
  [BlobStringReply<'last-generated-id'>, BlobStringReply],
  [BlobStringReply<'max-deleted-entry-id'>, BlobStringReply],
  [BlobStringReply<'entries-added'>, NumberReply],
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
    2(reply: Resp2Reply<XInfoStreamRawReply>) {
      return {
        length: reply[1],
        'radix-tree-keys': reply[3],
        'radix-tree-nodes': reply[5],
        'last-generated-id': reply[7],
        'max-deleted-entry-id': reply[9],
        'entries-added': reply[11],
        'recorded-first-entry-id': reply[13],
        groups: reply[15],
        'first-entry': transformEntry(reply[17]),
        'last-entry': transformEntry(reply[19])
      };
    },
    3(reply: any) { // TODO: is there a "type safe" way to do it?
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
  return entry === null ? null : transformStreamMessageReply(entry);
}
