import { CommandParser } from '../client/parser';
import { RedisArgument, ArrayReply, TuplesToMapReply, BlobStringReply, NumberReply, NullReply, Command } from '../RESP/types';
import { transformTuplesReply } from './generic-transformers';

/**
 * Reply structure for XINFO GROUPS command containing information about consumer groups
 */
export type XInfoGroupsReply = ArrayReply<TuplesToMapReply<[
  [BlobStringReply<'name'>, BlobStringReply],
  [BlobStringReply<'consumers'>, NumberReply],
  [BlobStringReply<'pending'>, NumberReply],
  [BlobStringReply<'last-delivered-id'>, BlobStringReply],
  /** added in 7.0 */
  [BlobStringReply<'entries-read'>, NumberReply | NullReply],
  /** added in 7.0 */
  [BlobStringReply<'lag'>, NumberReply | NullReply],
]>>;

export default {
  IS_READ_ONLY: true,
  parseCommand(parser: CommandParser, key: RedisArgument) {
    parser.push('XINFO', 'GROUPS');
    parser.pushKey(key);
  },
  transformReply: {
    /**
     * Transforms RESP2 reply into a structured consumer group information array
     * 
     * @param reply - Raw RESP2 reply from Redis
     * @returns Array of consumer group information objects containing:
     *          name - Name of the consumer group
     *          consumers - Number of consumers in the group
     *          pending - Number of pending messages for the group
     *          last-delivered-id - ID of the last delivered message
     *          entries-read - Number of entries read in the group (Redis 7.0+)
     *          lag - Number of entries not read by the group (Redis 7.0+)
     */
    2: (reply: Array<Array<BlobStringReply | NumberReply | NullReply>>) =>
      reply.map(group => transformTuplesReply(group as unknown as ArrayReply<BlobStringReply>)) as unknown as XInfoGroupsReply['DEFAULT'],
    3: undefined as unknown as () => XInfoGroupsReply
  }
} as const satisfies Command;
