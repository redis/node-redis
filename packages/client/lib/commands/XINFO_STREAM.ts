// import { RedisCommandArgument, RedisCommandArguments } from '.';
// import { StreamMessageReply, transformTuplesReply } from './generic-transformers';

// export const FIRST_KEY_INDEX = 2;

// export const IS_READ_ONLY = true;

// export function transformArguments(key: RedisCommandArgument): RedisCommandArguments {
//     return ['XINFO', 'STREAM', key];
// }

// interface XInfoStreamReply {
//     length: number;
//     radixTreeKeys: number;
//     radixTreeNodes: number;
//     groups: number;
//     lastGeneratedId: RedisCommandArgument;
//     firstEntry: StreamMessageReply | null;
//     lastEntry: StreamMessageReply | null;
// }

// export function transformReply(rawReply: Array<any>): XInfoStreamReply {
//     const parsedReply: Partial<XInfoStreamReply> = {};

//     for (let i = 0; i < rawReply.length; i+= 2) {
//         switch (rawReply[i]) {
//             case 'length':
//                 parsedReply.length = rawReply[i + 1];
//                 break;

//             case 'radix-tree-keys':
//                 parsedReply.radixTreeKeys = rawReply[i + 1];
//                 break;

//             case 'radix-tree-nodes':
//                 parsedReply.radixTreeNodes = rawReply[i + 1];
//                 break;

//             case 'groups':
//                 parsedReply.groups = rawReply[i + 1];
//                 break;

//             case 'last-generated-id':
//                 parsedReply.lastGeneratedId = rawReply[i + 1];
//                 break;

//             case 'first-entry':
//                 parsedReply.firstEntry = rawReply[i + 1] ? {
//                     id: rawReply[i + 1][0],
//                     message: transformTuplesReply(rawReply[i + 1][1])
//                 } : null;
//                 break;

//             case 'last-entry':
//                 parsedReply.lastEntry = rawReply[i + 1] ? {
//                     id: rawReply[i + 1][0],
//                     message: transformTuplesReply(rawReply[i + 1][1])
//                 } : null;
//                 break;
//         }
//     }

//     return parsedReply as XInfoStreamReply;
// }

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
