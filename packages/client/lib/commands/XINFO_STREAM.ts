import { CommandParser } from '../client/parser';
import { RedisArgument, TuplesToMapReply, BlobStringReply, NumberReply, NullReply, TuplesReply, ArrayReply, UnwrapReply, Command, TypeMapping } from '../RESP/types';
import { isNullReply, transformTuplesReply } from './generic-transformers';

/**
 * Reply structure for XINFO STREAM command containing detailed information about a stream
 *
 * @property length - Number of entries in the stream
 * @property radix-tree-keys - Number of radix tree keys
 * @property radix-tree-nodes - Number of radix tree nodes
 * @property last-generated-id - Last generated message ID
 * @property max-deleted-entry-id - Highest message ID deleted (Redis 7.2+)
 * @property entries-added - Total number of entries added (Redis 7.2+)
 * @property recorded-first-entry-id - ID of the first recorded entry (Redis 7.2+)
 * @property idmp-duration - The duration value configured for the stream's IDMP map (Redis 8.6+)
 * @property idmp-maxsize - The maxsize value configured for the stream's IDMP map (Redis 8.6+)
 * @property pids-tracked - The number of idempotent pids currently tracked in the stream (Redis 8.6+)
 * @property iids-tracked - The number of idempotent ids currently tracked in the stream (Redis 8.6+)
 * @property iids-added - The count of all entries with an idempotent iid added to the stream (Redis 8.6+)
 * @property iids-duplicates - The count of all duplicate iids detected during the stream's lifetime (Redis 8.6+)
 * @property groups - Number of consumer groups
 * @property first-entry - First entry in the stream
 * @property last-entry - Last entry in the stream
 */
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
  /** added in 8.6 */
  [BlobStringReply<'idmp-duration'>, NumberReply],
  /** added in 8.6 */
  [BlobStringReply<'idmp-maxsize'>, NumberReply],
  /** added in 8.6 */
  [BlobStringReply<'pids-tracked'>, NumberReply],
  /** added in 8.6 */
  [BlobStringReply<'iids-tracked'>, NumberReply],
  /** added in 8.6 */
  [BlobStringReply<'iids-added'>, NumberReply],
  /** added in 8.6 */
  [BlobStringReply<'iids-duplicates'>, NumberReply],
  [BlobStringReply<'groups'>, NumberReply],
  [BlobStringReply<'first-entry'>, ReturnType<typeof transformEntry>],
  [BlobStringReply<'last-entry'>, ReturnType<typeof transformEntry>]
]>;

export default {
  parseCommand(parser: CommandParser, key: RedisArgument) {
    parser.push('XINFO', 'STREAM');
    parser.pushKey(key);
  },
  transformReply: {
    // TODO: is there a "type safe" way to do it?
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- matches TransformReply contract
    2(reply: Array<unknown>, preserve?: any, typeMapping?: TypeMapping) {
      const parsedReply: Partial<XInfoStreamReply['DEFAULT']> = {};

      for (let i = 0; i < reply.length; i += 2) {
        switch (reply[i]) {
          case 'first-entry':
          case 'last-entry':
            parsedReply[reply[i] as ('first-entry' | 'last-entry')] = transformEntry(reply[i + 1] as RawEntry, typeMapping);
            break;

          default:
            parsedReply[reply[i] as keyof typeof parsedReply] = reply[i + 1] as never;
            break;
        }
      }

      return parsedReply as XInfoStreamReply['DEFAULT'];
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- matches TransformReply contract
    3(reply: Map<string, unknown> | Array<unknown> | Record<string, unknown>, preserve?: any, typeMapping?: TypeMapping) {
      if (reply instanceof Map) {
        reply.set(
          'first-entry',
          transformEntry(reply.get('first-entry') as RawEntry, typeMapping)
        );
        reply.set(
          'last-entry',
          transformEntry(reply.get('last-entry') as RawEntry, typeMapping)
        );
      } else if (reply instanceof Array) {
        // Find entries by key name to handle different Redis versions
        // (8.6+ has additional idempotency fields that shift the indices)
        for (let i = 0; i < reply.length; i += 2) {
          if (reply[i] === 'first-entry' || reply[i] === 'last-entry') {
            reply[i + 1] = transformEntry(reply[i + 1] as RawEntry, typeMapping);
          }
        }
      } else {
        reply['first-entry'] = transformEntry(reply['first-entry'] as RawEntry, typeMapping);
        reply['last-entry'] = transformEntry(reply['last-entry'] as RawEntry, typeMapping);
      }

      return reply as unknown as XInfoStreamReply;
    }
  }
} as const satisfies Command;

/**
 * Raw entry structure from Redis stream
 */
type RawEntry = TuplesReply<[
  id: BlobStringReply,
  message: ArrayReply<BlobStringReply>
]> | NullReply;

/**
 * Transforms a raw stream entry into a structured object
 * 
 * @param entry - Raw entry from Redis
 * @param typeMapping - Type mapping to apply to the entry's message
 * @returns Structured object with id and message, or null if entry is null
 */
function transformEntry(entry: RawEntry, typeMapping?: TypeMapping) {
  if (isNullReply(entry)) return entry;

  const [id, message] = entry as unknown as UnwrapReply<typeof entry>;
  return {
    id,
    message: transformTuplesReply(message, undefined, typeMapping)
  };
}
