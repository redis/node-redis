import { Command, ReplyUnion, TypeMapping } from '@redis/client/dist/lib/RESP/types';
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
        total: reply[0] as number,
        documents: reply.slice(1) as Array<string>
      }
    },
    3: (
      reply: ReplyUnion,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any -- matches TransformReply contract
      preserve?: any,
      typeMapping?: TypeMapping
    ): SearchNoContentReply => {
      const transformed = SEARCH.transformReply[3](reply, preserve, typeMapping) as {
        total: number;
        documents: Array<{
          id: string;
        }>;
      };

      return {
        total: transformed.total,
        documents: transformed.documents.map(document => document.id)
      };
    }
  },
} as const satisfies Command;

export interface SearchNoContentReply {
  total: number;
  documents: Array<string>;
};
