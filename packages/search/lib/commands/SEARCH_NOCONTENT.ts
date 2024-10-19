import { Command, ReplyUnion } from '@redis/client/lib/RESP/types';
import SEARCH, { SearchRawReply } from './SEARCH';

export default {
  NOT_KEYED_COMMAND: SEARCH.NOT_KEYED_COMMAND,
  IS_READ_ONLY: SEARCH.IS_READ_ONLY,
  parseCommand(...args: Parameters<typeof SEARCH.parseCommand>) {
    SEARCH.parseCommand(...args);
    args[0].push('NOCONTENT');
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
  unstableResp3: true
} as const satisfies Command;

export interface SearchNoContentReply {
  total: number;
  documents: Array<string>;
};