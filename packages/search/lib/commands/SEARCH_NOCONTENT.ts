import { Command, ReplyUnion, TypeMapping } from '@redis/client/dist/lib/RESP/types';
import SEARCH, { FtSearchOptions, SearchRawReply } from './SEARCH';

type SearchNoContentOptions = Omit<FtSearchOptions,
  'NOCONTENT' | 'WITHSCORES' | 'EXPLAINSCORE' | 'WITHPAYLOADS' | 'WITHSORTKEYS'
>;

export default {
  parseCommand(
    parser: Parameters<typeof SEARCH.parseCommand>[0],
    index: Parameters<typeof SEARCH.parseCommand>[1],
    query: Parameters<typeof SEARCH.parseCommand>[2],
    options?: SearchNoContentOptions) {
   SEARCH.parseCommand(parser, index, query, options as FtSearchOptions);
    parser.push('NOCONTENT');
  },
  transformReply: {
    2: (reply: SearchRawReply): SearchNoContentReply => {
      return {
        total: reply[0] as number,
        documents: reply.slice(1) as Array<string>,
        // FT.SEARCH only emits warnings on RESP3; RESP2 replies never carry them.
        warnings: []
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
        warnings: Array<string>;
      };

      return {
        total: transformed.total,
        documents: transformed.documents.map(document => document.id),
        warnings: transformed.warnings
      };
    }
  },
} as const satisfies Command;

export interface SearchNoContentReply {
  total: number;
  documents: Array<string>;
  /**
   * Warnings returned alongside partial results (e.g. on query timeout under a
   * `return` / `return-strict` on-timeout policy). Only populated on RESP3;
   * always empty on RESP2.
   */
  warnings: Array<string>;
};
