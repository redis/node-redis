import { CommandParser } from '../client/parser';
import { RedisArgument, BlobStringReply, NullReply, ArrayReply, TuplesReply, NumberReply, UnwrapReply, Command } from '../RESP/types';

/**
 * Raw reply structure for XPENDING command
 * 
 * @property pending - Number of pending messages in the group
 * @property firstId - ID of the first pending message
 * @property lastId - ID of the last pending message
 * @property consumers - Array of consumer info with delivery counts
 */
type XPendingRawReply = TuplesReply<[
  pending: NumberReply,
  firstId: BlobStringReply | NullReply,
  lastId: BlobStringReply | NullReply,
  consumers: ArrayReply<TuplesReply<[
    name: BlobStringReply,
    deliveriesCounter: BlobStringReply
  ]>> | NullReply
]>;

export default {
  CACHEABLE: true,
  IS_READ_ONLY: true,
  /**
   * Constructs the XPENDING command to inspect pending messages of a consumer group
   *
   * @param parser - The command parser
   * @param key - The stream key
   * @param group - Name of the consumer group
   * @returns Summary of pending messages including total count, ID range, and per-consumer stats 
   * @see https://redis.io/commands/xpending/
   */
  parseCommand(parser: CommandParser, key: RedisArgument, group: RedisArgument) {
    parser.push('XPENDING');
    parser.pushKey(key);
    parser.push(group);
  },
  /**
   * Transforms the raw XPENDING reply into a structured object
   * 
   * @param reply - Raw reply from Redis
   * @returns Object containing pending count, ID range, and consumer statistics
   */
  transformReply(reply: UnwrapReply<XPendingRawReply>) {
    const consumers = reply[3] as unknown as UnwrapReply<typeof reply[3]>;
    return {
      pending: reply[0],
      firstId: reply[1],
      lastId: reply[2],
      consumers: consumers === null ? null : consumers.map(consumer => {
        const [name, deliveriesCounter] = consumer as unknown as UnwrapReply<typeof consumer>;
        return {
          name,
          deliveriesCounter: Number(deliveriesCounter)
        };
      })
    }
  }
} as const satisfies Command;
