import { NullReply, ArrayReply, BlobStringReply, DoubleReply, UnwrapReply, Command, TypeMapping } from '@redis/client/lib/RESP/types';
import { isNullReply, transformDoubleReply } from '@redis/client/lib/commands/generic-transformers';
import SUGGET from './SUGGET';

type SuggestScore = {
  suggestion: BlobStringReply;
  score: DoubleReply;
}

export default {
  IS_READ_ONLY: SUGGET.IS_READ_ONLY,
  parseCommand(...args: Parameters<typeof SUGGET.parseCommand>) {
    SUGGET.parseCommand(...args);
    args[0].push('WITHSCORES');
  },
  transformReply: {
    2: (reply: NullReply | UnwrapReply<ArrayReply<BlobStringReply>>, preserve?: any, typeMapping?: TypeMapping) => {
      if (isNullReply(reply)) return null;

      const transformedReply: Array<SuggestScore> = new Array(reply.length / 2);
      let replyIndex = 0,
        arrIndex = 0;
      while (replyIndex < reply.length) {
        transformedReply[arrIndex++] = {
          suggestion: reply[replyIndex++],
          score: transformDoubleReply[2](reply[replyIndex++], preserve, typeMapping)
        };
      }

      return transformedReply;
    },
    3: (reply: UnwrapReply<ArrayReply<BlobStringReply | DoubleReply>>) => {
      if (isNullReply(reply)) return null;
      
      const transformedReply: Array<SuggestScore> = new Array(reply.length / 2);
      let replyIndex = 0,
        arrIndex = 0;
      while (replyIndex < reply.length) {
        transformedReply[arrIndex++] = {
          suggestion: reply[replyIndex++] as BlobStringReply,
          score: reply[replyIndex++] as DoubleReply
        };
      }

      return transformedReply;
    }
  }
} as const satisfies Command;
