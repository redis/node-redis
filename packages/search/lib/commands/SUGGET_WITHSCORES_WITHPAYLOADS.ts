import { NullReply, ArrayReply, BlobStringReply, DoubleReply, UnwrapReply, Command, TypeMapping } from '@redis/client/dist/lib/RESP/types';
import { isNullReply, transformDoubleReply } from '@redis/client/dist/lib/commands/generic-transformers';
import SUGGET from './SUGGET';

type SuggestScoreWithPayload = {
  suggestion: BlobStringReply;
  score: DoubleReply;
  payload: BlobStringReply;
}

export default {
  IS_READ_ONLY: SUGGET.IS_READ_ONLY,
  /**
   * Gets completion suggestions with their scores and payloads from a suggestion dictionary.
   * @param args - Same parameters as FT.SUGGET:
   *   - parser: The command parser
   *   - key: The suggestion dictionary key
   *   - prefix: The prefix to get completion suggestions for
   *   - options: Optional parameters for fuzzy matching and max results
   */
  parseCommand(...args: Parameters<typeof SUGGET.parseCommand>) {
    SUGGET.parseCommand(...args);
    args[0].push(
      'WITHSCORES',
      'WITHPAYLOADS'
    );
  },
  transformReply: {
    2: (reply: NullReply | UnwrapReply<ArrayReply<BlobStringReply>>, preserve?: any, typeMapping?: TypeMapping) => {
      if (isNullReply(reply)) return null;

      const transformedReply: Array<SuggestScoreWithPayload> = new Array(reply.length / 3);
      let replyIndex = 0,
        arrIndex = 0;
      while (replyIndex < reply.length) {
        transformedReply[arrIndex++] = {
          suggestion: reply[replyIndex++],
          score: transformDoubleReply[2](reply[replyIndex++], preserve, typeMapping),
          payload: reply[replyIndex++]
        };
      }

      return transformedReply;
    },
    3: (reply: NullReply | UnwrapReply<ArrayReply<BlobStringReply | DoubleReply>>) => {
      if (isNullReply(reply)) return null;

      const transformedReply: Array<SuggestScoreWithPayload> = new Array(reply.length / 3);
      let replyIndex = 0,
        arrIndex = 0;
      while (replyIndex < reply.length) {
        transformedReply[arrIndex++] = {
          suggestion: reply[replyIndex++] as BlobStringReply,
          score: reply[replyIndex++] as DoubleReply,
          payload: reply[replyIndex++] as BlobStringReply
        };
      }

      return transformedReply;
    }
  }
} as const satisfies Command;
