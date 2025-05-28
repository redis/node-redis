import { Command, ReplyUnion } from '@redis/client/dist/lib/RESP/types';
import SEARCH, { SearchRawReply } from './SEARCH';

export default {
  NOT_KEYED_COMMAND: SEARCH.NOT_KEYED_COMMAND,
  IS_READ_ONLY: SEARCH.IS_READ_ONLY,
  /**
   * Performs a search query but returns only document ids without their contents.
   * @param args - Same parameters as FT.SEARCH:
   *   - parser: The command parser
   *   - index: Name of the index to search
   *   - query: The text query to search
   *   - options: Optional search parameters
   */
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