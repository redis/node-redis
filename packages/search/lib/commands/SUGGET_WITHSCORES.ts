import { NullReply, ArrayReply, BlobStringReply, DoubleReply, UnwrapReply, Command } from '@redis/client/dist/lib/RESP/types';
import { isNullReply } from '@redis/client/dist/lib/commands/generic-transformers';
import SUGGET from './SUGGET';

export default {
  FIRST_KEY_INDEX: SUGGET.FIRST_KEY_INDEX,
  IS_READ_ONLY: SUGGET.IS_READ_ONLY,
  transformArguments(...args: Parameters<typeof SUGGET.transformArguments>) {
    const transformedArguments = SUGGET.transformArguments(...args);
    transformedArguments.push('WITHSCORES');
    return transformedArguments;
  },
  transformReply: {
    2: (reply: NullReply | UnwrapReply<ArrayReply<BlobStringReply>>) => {
      if (isNullReply(reply)) return null;

      const transformedReply: Array<{
        suggestion: BlobStringReply;
        score: number;
      }> = new Array(reply.length / 2);
      let replyIndex = 0,
        arrIndex = 0;
      while (replyIndex < reply.length) {
        transformedReply[arrIndex++] = {
          suggestion: reply[replyIndex++],
          score: Number(reply[replyIndex++])
        };
      }

      return transformedReply;
    },
    3: (reply: UnwrapReply<ArrayReply<BlobStringReply | DoubleReply>>) => {
      if (isNullReply(reply)) return null;
      
      const transformedReply: Array<{
        suggestion: BlobStringReply;
        score: DoubleReply;
      }> = new Array(reply.length / 2);
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
