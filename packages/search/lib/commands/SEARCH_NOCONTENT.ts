import { Command } from '@redis/client/dist/lib/RESP/types';
import SEARCH from './SEARCH';

export default {
  FIRST_KEY_INDEX: SEARCH.FIRST_KEY_INDEX,
  IS_READ_ONLY: SEARCH.IS_READ_ONLY,
  transformArguments(...args: Parameters<typeof SEARCH.transformArguments>) {
    const redisArgs = SEARCH.transformArguments(...args);
    redisArgs.push('NOCONTENT');
    return redisArgs;
  },
  transformReply: undefined as unknown as () => any
} as const satisfies Command;
