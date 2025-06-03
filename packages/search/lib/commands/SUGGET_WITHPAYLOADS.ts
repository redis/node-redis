import { NullReply, ArrayReply, BlobStringReply, UnwrapReply, Command } from '@redis/client/dist/lib/RESP/types';
import { isNullReply } from '@redis/client/dist/lib/commands/generic-transformers';
import SUGGET from './SUGGET';

export default {
  IS_READ_ONLY: SUGGET.IS_READ_ONLY,
  /**
   * Gets completion suggestions with their payloads from a suggestion dictionary.
   * @param args - Same parameters as FT.SUGGET:
   *   - parser: The command parser
   *   - key: The suggestion dictionary key
   *   - prefix: The prefix to get completion suggestions for
   *   - options: Optional parameters for fuzzy matching and max results
   */
  parseCommand(...args: Parameters<typeof SUGGET.parseCommand>) {
    SUGGET.parseCommand(...args);
    args[0].push('WITHPAYLOADS');
  },
  transformReply(reply: NullReply | UnwrapReply<ArrayReply<BlobStringReply>>) {
    if (isNullReply(reply)) return null;

    const transformedReply: Array<{
      suggestion: BlobStringReply;
      payload: BlobStringReply;
    }> = new Array(reply.length / 2);
    let replyIndex = 0,
      arrIndex = 0;
    while (replyIndex < reply.length) {
      transformedReply[arrIndex++] = {
        suggestion: reply[replyIndex++],
        payload: reply[replyIndex++]
      };
    }

    return transformedReply;
  }
} as const satisfies Command;
