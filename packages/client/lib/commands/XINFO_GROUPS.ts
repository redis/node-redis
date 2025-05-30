import { CommandParser } from '../client/parser';
import { RedisArgument, ArrayReply, TuplesToMapReply, BlobStringReply, NumberReply, NullReply, UnwrapReply, Resp2Reply, Command } from '../RESP/types';

/**
 * Reply structure for XINFO GROUPS command containing information about consumer groups
 */
export type XInfoGroupsReply = ArrayReply<TuplesToMapReply<[
  [BlobStringReply<'name'>, BlobStringReply],
  [BlobStringReply<'consumers'>, NumberReply],
  [BlobStringReply<'pending'>, NumberReply],
  [BlobStringReply<'last-delivered-id'>, NumberReply],
  /** added in 7.0 */
  [BlobStringReply<'entries-read'>, NumberReply | NullReply],
  /** added in 7.0 */
  [BlobStringReply<'lag'>, NumberReply],
]>>;

export default {
  IS_READ_ONLY: true,
  /**
   * Constructs the XINFO GROUPS command to list the consumer groups of a stream
   *
   * @param parser - The command parser
   * @param key - The stream key
   * @returns Array of consumer group information objects
   * @see https://redis.io/commands/xinfo-groups/
   */
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
    2: (reply: UnwrapReply<Resp2Reply<XInfoGroupsReply>>) => {
      return reply.map(group => {
        const unwrapped = group as unknown as UnwrapReply<typeof group>;
        return {
          name: unwrapped[1],
          consumers: unwrapped[3],
          pending: unwrapped[5],
          'last-delivered-id': unwrapped[7],
          'entries-read': unwrapped[9],
          lag: unwrapped[11]
        };
      });
    },
    3: undefined as unknown as () => XInfoGroupsReply
  }
} as const satisfies Command;
