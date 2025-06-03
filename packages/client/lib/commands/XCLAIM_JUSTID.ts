import { ArrayReply, BlobStringReply, Command } from '../RESP/types';
import XCLAIM from './XCLAIM';

/**
 * Command variant for XCLAIM that returns only message IDs
 */
export default {
  IS_READ_ONLY: XCLAIM.IS_READ_ONLY,
  /**
   * Constructs the XCLAIM command with JUSTID option to get only message IDs
   *
   * @param args - Same parameters as XCLAIM command
   * @returns Array of successfully claimed message IDs
   * @see https://redis.io/commands/xclaim/
   */
  parseCommand(...args: Parameters<typeof XCLAIM.parseCommand>) {
    const parser = args[0];
    XCLAIM.parseCommand(...args);
    parser.push('JUSTID');
  },
  /**
   * Transforms the XCLAIM JUSTID reply into an array of message IDs
   * 
   * @returns Array of claimed message IDs
   */
  transformReply: undefined as unknown as () => ArrayReply<BlobStringReply>
} as const satisfies Command;
