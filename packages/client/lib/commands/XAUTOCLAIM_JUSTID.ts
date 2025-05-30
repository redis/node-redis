import { TuplesReply, BlobStringReply, ArrayReply, UnwrapReply, Command } from '../RESP/types';
import XAUTOCLAIM from './XAUTOCLAIM';

/**
 * Raw reply structure for XAUTOCLAIM JUSTID command
 * 
 * @property nextId - The ID to use for the next XAUTOCLAIM call
 * @property messages - Array of message IDs that were claimed
 * @property deletedMessages - Array of message IDs that no longer exist
 */
type XAutoClaimJustIdRawReply = TuplesReply<[
  nextId: BlobStringReply,
  messages: ArrayReply<BlobStringReply>,
  deletedMessages: ArrayReply<BlobStringReply>
]>;

export default {
  IS_READ_ONLY: XAUTOCLAIM.IS_READ_ONLY,
  /**
   * Constructs the XAUTOCLAIM command with JUSTID option to get only message IDs
   *
   * @param args - Same parameters as XAUTOCLAIM command
   * @returns Object containing nextId and arrays of claimed and deleted message IDs
   * @see https://redis.io/commands/xautoclaim/
   */
  parseCommand(...args: Parameters<typeof XAUTOCLAIM.parseCommand>) {
    const parser = args[0];
    XAUTOCLAIM.parseCommand(...args);
    parser.push('JUSTID');
  },
  /**
   * Transforms the raw XAUTOCLAIM JUSTID reply into a structured object
   * 
   * @param reply - Raw reply from Redis
   * @returns Structured object containing nextId, message IDs, and deleted message IDs
   */
  transformReply(reply: UnwrapReply<XAutoClaimJustIdRawReply>) {
    return {
      nextId: reply[0],
      messages: reply[1],
      deletedMessages: reply[2]
    };
  }
} as const satisfies Command;
