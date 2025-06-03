import { CommandParser } from '../client/parser';
import { RedisArgument, ArrayReply, TuplesToMapReply, BlobStringReply, NumberReply, UnwrapReply, Resp2Reply, Command } from '../RESP/types';

/**
 * Reply structure for XINFO CONSUMERS command
 * 
 * @property name - Name of the consumer
 * @property pending - Number of pending messages for this consumer
 * @property idle - Idle time in milliseconds
 * @property inactive - Time in milliseconds since last interaction (Redis 7.2+)
 */
export type XInfoConsumersReply = ArrayReply<TuplesToMapReply<[
  [BlobStringReply<'name'>, BlobStringReply],
  [BlobStringReply<'pending'>, NumberReply],
  [BlobStringReply<'idle'>, NumberReply],
  /** added in 7.2 */
  [BlobStringReply<'inactive'>, NumberReply]
]>>;

export default {
  IS_READ_ONLY: true,
  /**
   * Constructs the XINFO CONSUMERS command to list the consumers in a consumer group
   *
   * @param parser - The command parser
   * @param key - The stream key
   * @param group - Name of the consumer group
   * @returns Array of consumer information objects
   * @see https://redis.io/commands/xinfo-consumers/
   */
  parseCommand(parser: CommandParser, key: RedisArgument, group: RedisArgument) {
    parser.push('XINFO', 'CONSUMERS');
    parser.pushKey(key);
    parser.push(group);
  },
  transformReply: {
    /**
     * Transforms RESP2 reply into a structured consumer information array
     * 
     * @param reply - Raw RESP2 reply from Redis
     * @returns Array of consumer information objects
     */
    2: (reply: UnwrapReply<Resp2Reply<XInfoConsumersReply>>) => {
      return reply.map(consumer => {
        const unwrapped = consumer as unknown as UnwrapReply<typeof consumer>;
        return {
          name: unwrapped[1],
          pending: unwrapped[3],
          idle: unwrapped[5],
          inactive: unwrapped[7]
        };
      });
    },
    3: undefined as unknown as () => XInfoConsumersReply
  }
} as const satisfies Command;
