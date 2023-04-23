import { ArrayReply, BlobStringReply, Command, NumberReply } from '../RESP/types';
import ZDIFF from './ZDIFF';
import { transformSortedSetWithScoresReply } from './generic-transformers';

export default {
  FIRST_KEY_INDEX: 2,
  IS_READ_ONLY: true,
  transformArguments(keys: Parameters<typeof ZDIFF.transformArguments>[0]) {
    const args = ZDIFF.transformArguments(keys);
    args.push('WITHSCORES');
    return args;
  },
  transformReply: {
    2: transformSortedSetWithScoresReply,
    3: (reply: ArrayReply<[BlobStringReply, NumberReply]>) => {
      return reply.map(([value, score]) => ({ value, score }));
    }
  }
} as const satisfies Command;
