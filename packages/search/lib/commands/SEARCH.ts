import { CommandParser } from '@redis/client/dist/lib/client/parser';
import { RedisArgument, Command, ReplyUnion, TypeMapping } from '@redis/client/dist/lib/RESP/types';
import { RedisVariadicArgument, parseOptionalVariadicArgument } from '@redis/client/dist/lib/commands/generic-transformers';
import { RediSearchLanguage } from './CREATE';
import { DEFAULT_DIALECT } from '../dialect/default';
import { getMapValue, mapLikeToObject, mapLikeValues, parseDocumentValue, parseSearchResultRow, parseWarnings } from './reply-transformers';

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
  WITHSCORES?: boolean;
  EXPLAINSCORE?: boolean;
  NOCONTENT?: boolean;
  WITHPAYLOADS?: boolean;
  WITHSORTKEYS?: boolean;
  FILTER?: {
    field: RedisArgument;
    min: number | RedisArgument;
    max: number | RedisArgument;
  } | Array<{
    field: RedisArgument;
    min: number | RedisArgument;
    max: number | RedisArgument;
  }>;
  GEOFILTER?: {
    field: RedisArgument;
    lon: number;
    lat: number;
    radius: number;
    unit: 'm' | 'km' | 'mi' | 'ft';
  } | Array<{
    field: RedisArgument;
    lon: number;
    lat: number;
    radius: number;
    unit: 'm' | 'km' | 'mi' | 'ft';
  }>;
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
  PAYLOAD?: RedisArgument;
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

  if(options?.NOCONTENT) {
    parser.push('NOCONTENT');
  }

  if (options?.WITHSCORES || options?.EXPLAINSCORE) {
    parser.push('WITHSCORES');
  }

  if (options?.EXPLAINSCORE) {
    parser.push('EXPLAINSCORE');
  }

  if(options?.WITHPAYLOADS) {
    parser.push('WITHPAYLOADS');
  }

  if(options?.WITHSORTKEYS) {
    parser.push('WITHSORTKEYS');
  }

  if (options?.FILTER) {
    const filters = Array.isArray(options.FILTER) ? options.FILTER : [options.FILTER];
    for (const filter of filters) {
      parser.push('FILTER', filter.field, filter.min.toString(), filter.max.toString());
    }
  }

  if (options?.GEOFILTER) {
    const geofilters = Array.isArray(options.GEOFILTER) ? options.GEOFILTER : [options.GEOFILTER];
    for (const geo of geofilters) {
      parser.push('GEOFILTER', geo.field, geo.lon.toString(), geo.lat.toString(), geo.radius.toString(), geo.unit);
    }
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

  if (options?.PAYLOAD) {
    parser.push('PAYLOAD', options.PAYLOAD);
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

function transformSearchReplyResp2(
  reply: SearchRawReply,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- matches TransformReply contract
  _preserve?: any,
  _typeMapping?: TypeMapping,
  options?: FtSearchOptions
): SearchReply {
  const documents: SearchReply['documents'] = [];
  
  const hasScores = Boolean(options?.WITHSCORES);
  const hasExplain = Boolean(options?.EXPLAINSCORE);
  const hasPayloads = Boolean(options?.WITHPAYLOADS);
  const hasSortKeys = Boolean(options?.WITHSORTKEYS);
  const noContent = Boolean(options?.NOCONTENT);

  let i = 1;
  while (i < reply.length) {
  
    const id = reply[i++] as string;

    let score: number | undefined;
    let scoreExplain: Array<string> | undefined;

    if (hasScores) {
      if (hasExplain && Array.isArray(reply[i])) {
        const tuple = reply[i++] as [string | number, Array<string>];
        score = Number(tuple[0]);
        scoreExplain = tuple[1];
      } else {
        score = Number(reply[i++]);
      }
    }

    let payload: string | undefined;
    if (hasPayloads){
      payload = reply[i++] as string;
    }

    let sortKey: string | undefined;
    if (hasSortKeys) {
      sortKey = reply[i++] as string;
    }

    let value: SearchDocumentValue = {};
    if (!noContent) {
      value = documentValue(reply[i++]) as SearchDocumentValue;
    }

    documents.push({
      id,
      ...(score !== undefined && !isNaN(score) ? {score} : {}),
      ...(scoreExplain !== undefined ? {scoreExplain} : {}),
      ...(payload !== undefined ? {payload} : {}),
      ...(sortKey !== undefined ? {sortKey} : {}),
      value,
    });
  }

  return {
    total: reply[0] as number,
    documents,
    // FT.SEARCH only emits warnings on RESP3; RESP2 replies never carry them.
    warnings: []
  };
}

function transformSearchReplyResp3(
  rawReply: ReplyUnion,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- matches TransformReply contract
  preserve?: any,
  typeMapping?: TypeMapping,
  options?: FtSearchOptions
): SearchReply {
  if (Array.isArray(rawReply)) {
    return transformSearchReplyResp2(rawReply as SearchRawReply, preserve, typeMapping,options);
  }

  const reply = mapLikeToObject(rawReply);
  const total = Number(getMapValue(reply, ['total_results', 'total']) ?? 0);

  const results = mapLikeValues(
    getMapValue(reply, ['results', 'documents']) ?? []
  );

  const documents: SearchReply['documents'] = results.map(result => {
    const resultMap = mapLikeToObject(result);
    const { id, value } = parseSearchResultRow(result);
    
    const rawScore = getMapValue(resultMap,['score']);
    const rawPayload = getMapValue(resultMap, ['payload']);
    const rawSortKey = getMapValue(resultMap, ['sortkey']);

    let score: number | undefined
    let scoreExplain: Array<string> | undefined;

    if (Array.isArray(rawScore)){
      score = Number(rawScore[0]);
      if (Array.isArray(rawScore[1])){
        scoreExplain = rawScore[1].map(String);
      }
    } else if (rawScore !== undefined && rawScore !== null){
      score = typeof rawScore === 'number' ? rawScore : Number(rawScore);
    }

    return {
      id: String((id as { toString?(): string })?.toString?.() ?? id ?? ''),
      ...(score !== undefined && !isNaN(score) ? {score} : {}),
      ...(scoreExplain !== undefined ? {scoreExplain} : {}),
      ...(rawPayload !== undefined && rawPayload !== null? {payload: String(rawPayload)} : {}),
      ...(rawSortKey !== undefined && rawSortKey !== null ? {sortKey: String(rawSortKey)} : {}),
      value: value as SearchDocumentValue
    };
  });

  return {
    total,
    documents,
    warnings: parseWarnings(reply)
  };
}

export default {
  // Keyless read: replica-safe, but the metadata-derived isReplicaSafe
  // returns false for keyless commands, so opt in explicitly (restores the
  // pre-derivation master behavior).
  IS_READ_ONLY: true,
  parseCommand(parser: CommandParser, index: RedisArgument, query: RedisArgument, options?: FtSearchOptions) {
    parser.push('FT.SEARCH', index, query);

    parseSearchOptions(parser, options);
  },
  transformReply: {
    2: transformSearchReplyResp2,
    3: transformSearchReplyResp3
  },
} as const satisfies Command;

export type SearchRawReply = Array<unknown>;

interface SearchDocumentValue {
  [key: string]: string | number | null | Array<SearchDocumentValue> | SearchDocumentValue;
}

export interface SearchReply {
  total: number;
  documents: Array<{
      id: string;
      score?: number;
      scoreExplain?: Array<string>;
      payload?: string;
      sortKey?: string;
      value: SearchDocumentValue;
  }>;
  /**
   * Warnings returned alongside partial results (e.g. on query timeout under a
   * `return` / `return-strict` on-timeout policy). Only populated on RESP3;
   * always empty on RESP2.
   */
  warnings: Array<string>;
}

function documentValue(tuples: unknown) {
  return parseDocumentValue(tuples);
}
