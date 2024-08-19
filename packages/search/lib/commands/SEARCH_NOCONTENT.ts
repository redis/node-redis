import { Command, ReplyUnion } from '@redis/client/dist/lib/RESP/types';
import SEARCH, { SearchRawReply } from './SEARCH';

export default {
  FIRST_KEY_INDEX: SEARCH.FIRST_KEY_INDEX,
  IS_READ_ONLY: SEARCH.IS_READ_ONLY,
  transformArguments(...args: Parameters<typeof SEARCH.transformArguments>) {
    const redisArgs = SEARCH.transformArguments(...args);
    redisArgs.push('NOCONTENT');
    return redisArgs;
  },
  transformReply: {
    2: (reply: SearchRawReply): SearchNoContentReply => {
      return {
        total: reply[0],
        documents: reply.slice(1)
      }
    },
    3: undefined as unknown as () => ReplyUnion
  },
  unstableResp3SearchModule: true
} as const satisfies Command;

export interface SearchNoContentReply {
  total: number;
  documents: Array<string>;
};