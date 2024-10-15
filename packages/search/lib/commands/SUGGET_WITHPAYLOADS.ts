import { NullReply, ArrayReply, BlobStringReply, UnwrapReply, Command } from '@redis/client/dist/lib/RESP/types';
import { isNullReply } from '@redis/client/dist/lib/commands/generic-transformers';
import SUGGET from './SUGGET';

export default {
  FIRST_KEY_INDEX: SUGGET.FIRST_KEY_INDEX,
  IS_READ_ONLY: SUGGET.IS_READ_ONLY,
  transformArguments(...args: Parameters<typeof SUGGET.transformArguments>) {
    const transformedArguments = SUGGET.transformArguments(...args);
    transformedArguments.push('WITHPAYLOADS');
    return transformedArguments;
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
