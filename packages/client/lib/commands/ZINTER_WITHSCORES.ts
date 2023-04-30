// import { RedisCommandArguments } from '.';
// import { transformArguments as transformZInterArguments } from './ZINTER';

// export { FIRST_KEY_INDEX, IS_READ_ONLY } from './ZINTER';

// export function transformArguments(...args: Parameters<typeof transformZInterArguments>): RedisCommandArguments {
//     return [
//         ...transformZInterArguments(...args),
//         'WITHSCORES'
//     ];
// }



// // transformSortedSetWithScoresReply

import { ArrayReply, BlobStringReply, Command, DoubleReply } from '../RESP/types';
import ZINTER from './ZINTER';
import { transformSortedSetWithScoresReply } from './generic-transformers';

export default {
  FIRST_KEY_INDEX: ZINTER.FIRST_KEY_INDEX,
  IS_READ_ONLY: ZINTER.IS_READ_ONLY,
  transformArguments(...args: Parameters<typeof ZINTER.transformArguments>) {
    const redisArgs = ZINTER.transformArguments(...args);
    redisArgs.push('WITHSCORES');
    return redisArgs;
  },
  transformReply: {
    2: transformSortedSetWithScoresReply,
    3: (reply: ArrayReply<[BlobStringReply, DoubleReply]>) => {
      return reply.map(([member, score]) => ({
        member,
        score
      }));
    }
  }
} as const satisfies Command;
