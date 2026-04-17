import { CommandParser } from '@redis/client/dist/lib/client/parser';
import { RedisArgument, Command, ReplyUnion } from '@redis/client/dist/lib/RESP/types';
import { RedisVariadicArgument, parseOptionalVariadicArgument } from '@redis/client/dist/lib/commands/generic-transformers';
import { RediSearchLanguage } from './CREATE';
import { DEFAULT_DIALECT } from '../dialect/default';
import { getMapValue, mapLikeToObject, mapLikeValues, parseDocumentValue, parseSearchResultRow } from './reply-transformers';

export type FtSearchParams = Record<string, RedisArgument | number>;

export function parseParamsArgument(parser: CommandParser, params?: FtSearchParams) {
  if (params) {
    parser.push('PARAMS');

    const args: Array<RedisArgument> = [];
    for (const key in params) {
      if (!Object.hasOwn(params, key)) continue;

      const value = params[key];
      args.push(
        key,
        typeof value === 'number' ? value.toString() : value
      );
    }

    parser.pushVariadicWithLength(args);
  }
}

export interface FtSearchOptions {
  VERBATIM?: boolean;
  NOSTOPWORDS?: boolean;
  INKEYS?: RedisVariadicArgument;
  INFIELDS?: RedisVariadicArgument;
  RETURN?: RedisVariadicArgument;
  SUMMARIZE?: boolean | {
    FIELDS?: RedisArgument | Array<RedisArgument>;
    FRAGS?: number;
    LEN?: number;
    SEPARATOR?: RedisArgument;
  };
  HIGHLIGHT?: boolean | {
    FIELDS?: RedisArgument | Array<RedisArgument>;
    TAGS?: {
      open: RedisArgument;
      close: RedisArgument;
    };
  };
  SLOP?: number;
  TIMEOUT?: number;
  INORDER?: boolean;
  LANGUAGE?: RediSearchLanguage;
  EXPANDER?: RedisArgument;
  SCORER?: RedisArgument;
  SORTBY?: RedisArgument | {
    BY: RedisArgument;
    DIRECTION?: 'ASC' | 'DESC';
  };
  LIMIT?: {
    from: number | RedisArgument;
    size: number | RedisArgument;
  };
  PARAMS?: FtSearchParams;
  DIALECT?: number;
}

export function parseSearchOptions(parser: CommandParser, options?: FtSearchOptions) {
  if (options?.VERBATIM) {
    parser.push('VERBATIM');
  }

  if (options?.NOSTOPWORDS) {
    parser.push('NOSTOPWORDS');
  }

  parseOptionalVariadicArgument(parser, 'INKEYS', options?.INKEYS);
  parseOptionalVariadicArgument(parser, 'INFIELDS', options?.INFIELDS);
  parseOptionalVariadicArgument(parser, 'RETURN', options?.RETURN);

  if (options?.SUMMARIZE) {
    parser.push('SUMMARIZE');

    if (typeof options.SUMMARIZE === 'object') {
      parseOptionalVariadicArgument(parser, 'FIELDS', options.SUMMARIZE.FIELDS);

      if (options.SUMMARIZE.FRAGS !== undefined) {
        parser.push('FRAGS', options.SUMMARIZE.FRAGS.toString());
      }

      if (options.SUMMARIZE.LEN !== undefined) {
        parser.push('LEN', options.SUMMARIZE.LEN.toString());
      }

      if (options.SUMMARIZE.SEPARATOR !== undefined) {
        parser.push('SEPARATOR', options.SUMMARIZE.SEPARATOR);
      }
    }
  }

  if (options?.HIGHLIGHT) {
    parser.push('HIGHLIGHT');

    if (typeof options.HIGHLIGHT === 'object') {
      parseOptionalVariadicArgument(parser, 'FIELDS', options.HIGHLIGHT.FIELDS);

      if (options.HIGHLIGHT.TAGS) {
        parser.push('TAGS', options.HIGHLIGHT.TAGS.open, options.HIGHLIGHT.TAGS.close);
      }
    }
  }

  if (options?.SLOP !== undefined) {
    parser.push('SLOP', options.SLOP.toString());
  }

  if (options?.TIMEOUT !== undefined) {
    parser.push('TIMEOUT', options.TIMEOUT.toString());
  }

  if (options?.INORDER) {
    parser.push('INORDER');
  }

  if (options?.LANGUAGE) {
    parser.push('LANGUAGE', options.LANGUAGE);
  }

  if (options?.EXPANDER) {
    parser.push('EXPANDER', options.EXPANDER);
  }

  if (options?.SCORER) {
    parser.push('SCORER', options.SCORER);
  }

  if (options?.SORTBY) {
    parser.push('SORTBY');

    if (typeof options.SORTBY === 'string' || options.SORTBY instanceof Buffer) {
      parser.push(options.SORTBY);
    } else {
      parser.push(options.SORTBY.BY);

      if (options.SORTBY.DIRECTION) {
        parser.push(options.SORTBY.DIRECTION);
      }
    }
  }

  if (options?.LIMIT) {
    parser.push('LIMIT', options.LIMIT.from.toString(), options.LIMIT.size.toString());
  }

  parseParamsArgument(parser, options?.PARAMS);

  if (options?.DIALECT) {
    parser.push('DIALECT', options.DIALECT.toString());
  } else {
    parser.push('DIALECT', DEFAULT_DIALECT);
  }
}

function transformSearchReplyResp2(reply: SearchRawReply): SearchReply {
  // if reply[2] is array, then we have content/documents. Otherwise, only ids
  const withoutDocuments = reply.length > 2 && !Array.isArray(reply[2]);

  const documents = [];
  let i = 1;
  while (i < reply.length) {
    documents.push({
      id: reply[i++],
      value: withoutDocuments ? {} : documentValue(reply[i++])
    });
  }

  return {
    total: reply[0],
    documents
  };
}

function transformSearchReplyResp3(rawReply: ReplyUnion): SearchReply {
  if (Array.isArray(rawReply)) {
    return transformSearchReplyResp2(rawReply as SearchRawReply);
  }

  const reply = mapLikeToObject(rawReply);
  const total = Number(getMapValue(reply, ['total_results', 'total']) ?? 0);

  const results = mapLikeValues(
    getMapValue(reply, ['results', 'documents']) ?? []
  );

  const documents = results.map(result => {
    const { id, value } = parseSearchResultRow(result);
    return {
      id: id?.toString?.() ?? id,
      value
    };
  });

  return {
    total,
    documents
  };
}

export default {
  NOT_KEYED_COMMAND: true,
  IS_READ_ONLY: true,
  /**
   * Searches a RediSearch index with the given query.
   * @param parser - The command parser
   * @param index - The index name to search
   * @param query - The text query to search. For syntax, see https://redis.io/docs/stack/search/reference/query_syntax
   * @param options - Optional search parameters including:
   *   - VERBATIM: do not try to use stemming for query expansion
   *   - NOSTOPWORDS: do not filter stopwords from the query
   *   - INKEYS/INFIELDS: restrict the search to specific keys/fields
   *   - RETURN: limit which fields are returned
   *   - SUMMARIZE/HIGHLIGHT: create search result highlights
   *   - LIMIT: pagination control
   *   - SORTBY: sort results by a specific field
   *   - PARAMS: bind parameters to the query
   */
  parseCommand(parser: CommandParser, index: RedisArgument, query: RedisArgument, options?: FtSearchOptions) {
    parser.push('FT.SEARCH', index, query);

    parseSearchOptions(parser, options);
  },
  transformReply: {
    2: transformSearchReplyResp2,
    3: transformSearchReplyResp3
  },
} as const satisfies Command;

export type SearchRawReply = Array<any>;

interface SearchDocumentValue {
  [key: string]: string | number | null | Array<SearchDocumentValue> | SearchDocumentValue;
}

export interface SearchReply {
  total: number;
  documents: Array<{
      id: string;
      value: SearchDocumentValue;
  }>;
}

function documentValue(tuples: any) {
  return parseDocumentValue(tuples);
}
