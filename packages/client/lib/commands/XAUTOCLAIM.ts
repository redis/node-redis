import { CommandParser } from '../client/parser';
import { RedisArgument, TuplesReply, BlobStringReply, ArrayReply, NullReply, UnwrapReply, Command, TypeMapping } from '../RESP/types';
import { StreamMessageRawReply, transformStreamMessageNullReply } from './generic-transformers';

/**
 * Options for the XAUTOCLAIM command
 * 
 * @property COUNT - Limit the number of messages to claim
 */
export interface XAutoClaimOptions {
  COUNT?: number;
}

/**
 * Raw reply structure for XAUTOCLAIM command
 * 
 * @property nextId - The ID to use for the next XAUTOCLAIM call
 * @property messages - Array of claimed messages or null entries
 * @property deletedMessages - Array of message IDs that no longer exist
 */
export type XAutoClaimRawReply = TuplesReply<[
  nextId: BlobStringReply,
  messages: ArrayReply<StreamMessageRawReply | NullReply>,
  deletedMessages: ArrayReply<BlobStringReply>
]>;

export default {
  IS_READ_ONLY: false,
  /**
   * Constructs the XAUTOCLAIM command to automatically claim pending messages in a consumer group
   *
   * @param parser - The command parser
   * @param key - The stream key
   * @param group - The consumer group name
   * @param consumer - The consumer name that will claim the messages
   * @param minIdleTime - Minimum idle time in milliseconds for a message to be claimed
   * @param start - Message ID to start scanning from
   * @param options - Additional options for the claim operation
   * @returns Object containing nextId, claimed messages, and list of deleted message IDs
   * @see https://redis.io/commands/xautoclaim/
   */
  parseCommand(
    parser: CommandParser,
    key: RedisArgument,
    group: RedisArgument,
    consumer: RedisArgument,
    minIdleTime: number,
    start: RedisArgument,
    options?: XAutoClaimOptions
  ) {
    parser.push('XAUTOCLAIM');
    parser.pushKey(key);
    parser.push(group, consumer, minIdleTime.toString(), start);

    if (options?.COUNT) {
      parser.push('COUNT', options.COUNT.toString());
    }
  },
  /**
   * Transforms the raw XAUTOCLAIM reply into a structured object
   * 
   * @param reply - Raw reply from Redis
   * @param preserve - Preserve options (unused)
   * @param typeMapping - Type mapping for message fields
   * @returns Structured object containing nextId, messages, and deletedMessages
   */
  transformReply(reply: UnwrapReply<XAutoClaimRawReply>, preserve?: any, typeMapping?: TypeMapping) {
    return {
      nextId: reply[0],
      messages: (reply[1] as unknown as UnwrapReply<typeof reply[1]>).map(transformStreamMessageNullReply.bind(undefined, typeMapping)),
      deletedMessages: reply[2]
    };
  }
} as const satisfies Command;
