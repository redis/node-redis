import { RedisArgument, TuplesToMapReply, BlobStringReply, NumberReply, NullReply, TuplesReply, ArrayReply, UnwrapReply, Command, SimpleStringReply } from '../RESP/types';
import { isNullReply, transformTuplesReply } from './generic-transformers';

export type XInfoStreamReply = TuplesToMapReply<[
  [SimpleStringReply<'length'>, NumberReply],
  [SimpleStringReply<'radix-tree-keys'>, NumberReply],
  [SimpleStringReply<'radix-tree-nodes'>, NumberReply],
  [SimpleStringReply<'last-generated-id'>, BlobStringReply],
  /** added in 7.2 */
  [SimpleStringReply<'max-deleted-entry-id'>, BlobStringReply],
  /** added in 7.2 */
  [SimpleStringReply<'entries-added'>, NumberReply],
  /** added in 7.2 */
  [SimpleStringReply<'recorded-first-entry-id'>, BlobStringReply],
  [SimpleStringReply<'groups'>, NumberReply],
  [SimpleStringReply<'first-entry'>, ReturnType<typeof transformEntry>],
  [SimpleStringReply<'last-entry'>, ReturnType<typeof transformEntry>]
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

type RawEntry = TuplesReply<[
  id: BlobStringReply,
  message: ArrayReply<BlobStringReply>
]> | NullReply;

function transformEntry(entry: RawEntry) {
  if (isNullReply(entry)) return entry;

  const [id, message] = entry as unknown as UnwrapReply<typeof entry>;
  return {
    id,
    message: transformTuplesReply(message)
  };
}
