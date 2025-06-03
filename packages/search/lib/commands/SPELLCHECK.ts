import { CommandParser } from '@redis/client/dist/lib/client/parser';
import { RedisArgument, Command, ReplyUnion } from '@redis/client/dist/lib/RESP/types';
import { DEFAULT_DIALECT } from '../dialect/default';

export interface Terms {
  mode: 'INCLUDE' | 'EXCLUDE';
  dictionary: RedisArgument;
}

export interface FtSpellCheckOptions {
  DISTANCE?: number;
  TERMS?: Terms | Array<Terms>;
  DIALECT?: number;
}

export default {
  NOT_KEYED_COMMAND: true,
  IS_READ_ONLY: true,
  /**
   * Performs spelling correction on a search query.
   * @param parser - The command parser
   * @param index - Name of the index to use for spelling corrections
   * @param query - The search query to check for spelling
   * @param options - Optional parameters:
   *   - DISTANCE: Maximum Levenshtein distance for spelling suggestions
   *   - TERMS: Custom dictionary terms to include/exclude
   *   - DIALECT: Version of query dialect to use (defaults to 1)
   */
  parseCommand(parser: CommandParser, index: RedisArgument, query: RedisArgument, options?: FtSpellCheckOptions) {
    parser.push('FT.SPELLCHECK', index, query);

    if (options?.DISTANCE) {
      parser.push('DISTANCE', options.DISTANCE.toString());
    }

    if (options?.TERMS) {
      if (Array.isArray(options.TERMS)) {
        for (const term of options.TERMS) {
          parseTerms(parser, term);
        }
      } else {
        parseTerms(parser, options.TERMS);
      }
    }

    if (options?.DIALECT) {
      parser.push('DIALECT', options.DIALECT.toString());
    } else {
      parser.push('DIALECT', DEFAULT_DIALECT);
    }
  },
  transformReply: {
    2: (rawReply: SpellCheckRawReply): SpellCheckReply => {
      return rawReply.map(([, term, suggestions]) => ({
        term,
        suggestions: suggestions.map(([score, suggestion]) => ({
          score: Number(score),
          suggestion
        }))
      }));
    },
    3: undefined as unknown as () => ReplyUnion,
  },
  unstableResp3: true
} as const satisfies Command;

function parseTerms(parser: CommandParser, { mode, dictionary }: Terms) {
  parser.push('TERMS', mode, dictionary);
}

type SpellCheckRawReply = Array<[
  _: string,
  term: string,
  suggestions: Array<[score: string, suggestion: string]>
]>;

type SpellCheckReply = Array<{
  term: string,
  suggestions: Array<{
    score: number,
    suggestion: string
  }>
}>;
