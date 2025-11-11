import { CommandParser } from '@redis/client/dist/lib/client/parser';
import { RedisArgument, Command, ReplyUnion } from '@redis/client/dist/lib/RESP/types';
import { RedisVariadicArgument, parseOptionalVariadicArgument } from '@redis/client/dist/lib/commands/generic-transformers';
import { FtSearchParams, parseParamsArgument } from './SEARCH';

export interface FtHybridSearchExpression {
  query: RedisArgument;
  SCORER?: {
    algorithm: RedisArgument;
    params?: Array<RedisArgument>;
  };
  YIELD_SCORE_AS?: RedisArgument;
}

export interface FtHybridVectorMethod {
  KNN?: {
    K: number;
    EF_RUNTIME?: number;
    YIELD_DISTANCE_AS?: RedisArgument;
  };
  RANGE?: {
    RADIUS: number;
    EPSILON?: number;
    YIELD_DISTANCE_AS?: RedisArgument;
  };
}

export interface FtHybridVectorExpression {
  field: RedisArgument;
  vectorData: RedisArgument;
  method?: FtHybridVectorMethod;
  FILTER?: {
    expression: RedisArgument;
    POLICY?: 'ADHOC' | 'BATCHES' | 'ACORN';
    BATCHES?: {
      BATCH_SIZE: number;
    };
  };
  YIELD_SCORE_AS?: RedisArgument;
}

export interface FtHybridCombineMethod {
  RRF?: {
    count: number;
    WINDOW?: number;
    CONSTANT?: number;
  };
  LINEAR?: {
    count: number;
    ALPHA?: number;
    BETA?: number;
  };
  FUNCTION?: RedisArgument;
}

export interface FtHybridOptions {
  SEARCH?: FtHybridSearchExpression;
  VSIM?: FtHybridVectorExpression;
  COMBINE?: {
    method: FtHybridCombineMethod;
    YIELD_SCORE_AS?: RedisArgument;
  };
  LOAD?: RedisVariadicArgument;
  GROUPBY?: {
    fields: RedisVariadicArgument;
    REDUCE?: {
      function: RedisArgument;
      count: number;
      args: Array<RedisArgument>;
    };
  };
  APPLY?: {
    expression: RedisArgument;
    AS: RedisArgument;
  };
  SORTBY?: {
    count: number;
    fields: Array<{
      field: RedisArgument;
      direction?: 'ASC' | 'DESC';
    }>;
  };
  FILTER?: RedisArgument;
  LIMIT?: {
    offset: number | RedisArgument;
    num: number | RedisArgument;
  };
  PARAMS?: FtSearchParams;
  EXPLAINSCORE?: boolean;
  TIMEOUT?: number;
  WITHCURSOR?: {
    COUNT?: number;
    MAXIDLE?: number;
  };
}

function parseSearchExpression(parser: CommandParser, search: FtHybridSearchExpression) {
  parser.push('SEARCH', search.query);

  if (search.SCORER) {
    parser.push('SCORER', search.SCORER.algorithm);
    if (search.SCORER.params) {
      parser.push(...search.SCORER.params);
    }
  }

  if (search.YIELD_SCORE_AS) {
    parser.push('YIELD_SCORE_AS', search.YIELD_SCORE_AS);
  }
}

function parseVectorExpression(parser: CommandParser, vsim: FtHybridVectorExpression) {
  parser.push('VSIM', vsim.field, vsim.vectorData);

  if (vsim.method) {
    if (vsim.method.KNN) {
      const knn = vsim.method.KNN;
      parser.push('KNN', '1', 'K', knn.K.toString());

      if (knn.EF_RUNTIME !== undefined) {
        parser.push('EF_RUNTIME', knn.EF_RUNTIME.toString());
      }

      if (knn.YIELD_DISTANCE_AS) {
        parser.push('YIELD_DISTANCE_AS', knn.YIELD_DISTANCE_AS);
      }
    }

    if (vsim.method.RANGE) {
      const range = vsim.method.RANGE;
      parser.push('RANGE', '1', 'RADIUS', range.RADIUS.toString());

      if (range.EPSILON !== undefined) {
        parser.push('EPSILON', range.EPSILON.toString());
      }

      if (range.YIELD_DISTANCE_AS) {
        parser.push('YIELD_DISTANCE_AS', range.YIELD_DISTANCE_AS);
      }
    }
  }

  if (vsim.FILTER) {
    parser.push('FILTER', vsim.FILTER.expression);

    if (vsim.FILTER.POLICY) {
      parser.push('POLICY', vsim.FILTER.POLICY);

      if (vsim.FILTER.POLICY === 'BATCHES' && vsim.FILTER.BATCHES) {
        parser.push('BATCHES', 'BATCH_SIZE', vsim.FILTER.BATCHES.BATCH_SIZE.toString());
      }
    }
  }

  if (vsim.YIELD_SCORE_AS) {
    parser.push('YIELD_SCORE_AS', vsim.YIELD_SCORE_AS);
  }
}

function parseCombineMethod(parser: CommandParser, combine: FtHybridOptions['COMBINE']) {
  if (!combine) return;

  parser.push('COMBINE');

  if (combine.method.RRF) {
    const rrf = combine.method.RRF;
    parser.push('RRF', rrf.count.toString());

    if (rrf.WINDOW !== undefined) {
      parser.push('WINDOW', rrf.WINDOW.toString());
    }

    if (rrf.CONSTANT !== undefined) {
      parser.push('CONSTANT', rrf.CONSTANT.toString());
    }
  }

  if (combine.method.LINEAR) {
    const linear = combine.method.LINEAR;
    parser.push('LINEAR', linear.count.toString());

    if (linear.ALPHA !== undefined) {
      parser.push('ALPHA', linear.ALPHA.toString());
    }

    if (linear.BETA !== undefined) {
      parser.push('BETA', linear.BETA.toString());
    }
  }

  if (combine.method.FUNCTION) {
    parser.push('FUNCTION', combine.method.FUNCTION);
  }

  if (combine.YIELD_SCORE_AS) {
    parser.push('YIELD_SCORE_AS', combine.YIELD_SCORE_AS);
  }
}

function parseHybridOptions(parser: CommandParser, options?: FtHybridOptions) {
  if (!options) return;

  if (options.SEARCH) {
    parseSearchExpression(parser, options.SEARCH);
  }

  if (options.VSIM) {
    parseVectorExpression(parser, options.VSIM);
  }

  if (options.COMBINE) {
    parseCombineMethod(parser, options.COMBINE);
  }

  parseOptionalVariadicArgument(parser, 'LOAD', options.LOAD);

  if (options.GROUPBY) {
    parseOptionalVariadicArgument(parser, 'GROUPBY', options.GROUPBY.fields);

    if (options.GROUPBY.REDUCE) {
      parser.push('REDUCE', options.GROUPBY.REDUCE.function, options.GROUPBY.REDUCE.count.toString());
      parser.push(...options.GROUPBY.REDUCE.args);
    }
  }

  if (options.APPLY) {
    parser.push('APPLY', options.APPLY.expression, 'AS', options.APPLY.AS);
  }

  if (options.SORTBY) {
    parser.push('SORTBY', options.SORTBY.count.toString());
    for (const sortField of options.SORTBY.fields) {
      parser.push(sortField.field);
      if (sortField.direction) {
        parser.push(sortField.direction);
      }
    }
  }

  if (options.FILTER) {
    parser.push('FILTER', options.FILTER);
  }

  if (options.LIMIT) {
    parser.push('LIMIT', options.LIMIT.offset.toString(), options.LIMIT.num.toString());
  }

  parseParamsArgument(parser, options.PARAMS);

  if (options.EXPLAINSCORE) {
    parser.push('EXPLAINSCORE');
  }

  if (options.TIMEOUT !== undefined) {
    parser.push('TIMEOUT', options.TIMEOUT.toString());
  }

  if (options.WITHCURSOR) {
    parser.push('WITHCURSOR');

    if (options.WITHCURSOR.COUNT !== undefined) {
      parser.push('COUNT', options.WITHCURSOR.COUNT.toString());
    }

    if (options.WITHCURSOR.MAXIDLE !== undefined) {
      parser.push('MAXIDLE', options.WITHCURSOR.MAXIDLE.toString());
    }
  }
}

export default {
  NOT_KEYED_COMMAND: true,
  IS_READ_ONLY: true,
  /**
   * Performs a hybrid search combining multiple search expressions.
   * Supports multiple SEARCH and VECTOR expressions with various fusion methods.
   *
   * @experimental
   * NOTE: FT.Hybrid is still in experimental state
   * It's behaviour and function signature may change
   *
   * @param parser - The command parser
   * @param index - The index name to search
   * @param options - Hybrid search options including:
   *   - SEARCH: Text search expression with optional scoring
   *   - VSIM: Vector similarity expression with KNN/RANGE methods
   *   - COMBINE: Fusion method (RRF, LINEAR, FUNCTION)
   *   - Post-processing operations: LOAD, GROUPBY, APPLY, SORTBY, FILTER
   *   - Tunable options: LIMIT, PARAMS, EXPLAINSCORE, TIMEOUT, WITHCURSOR
   */
  parseCommand(parser: CommandParser, index: RedisArgument, options?: FtHybridOptions) {
    parser.push('FT.HYBRID', index);

    parseHybridOptions(parser, options);

  },
  transformReply: {
    2: (reply: any): any => {
      // Check if this is a cursor reply: [[results...], cursorId]
      if (Array.isArray(reply) && reply.length === 2 && typeof reply[1] === 'number') {
        // This is a cursor reply
        const [searchResults, cursor] = reply;
        const transformedResults = transformHybridSearchResults(searchResults);

        return {
          ...transformedResults,
          cursor
        };
      } else {
        // Normal reply without cursor
        return transformHybridSearchResults(reply);
      }
    },
    3: undefined as unknown as () => ReplyUnion
  },
  unstableResp3: true
} as const satisfies Command;

function transformHybridSearchResults(reply: any) {
  // Similar structure to FT.SEARCH reply transformation
  const withoutDocuments = reply.length > 2 && !Array.isArray(reply[2]);

  const documents = [];
  let i = 1;
  while (i < reply.length) {
    documents.push({
      id: reply[i++],
      value: withoutDocuments ? Object.create(null) : documentValue(reply[i++])
    });
  }

  return {
    total: reply[0],
    documents
  };
}

function documentValue(tuples: any) {
  const message = Object.create(null);

  if (!tuples) {
    return message;
  }

  let i = 0;
  while (i < tuples.length) {
    const key = tuples[i++];
    const value = tuples[i++];

    if (key === '$') { // might be a JSON reply
      try {
        Object.assign(message, JSON.parse(value));
        continue;
      } catch {
        // set as a regular property if not a valid JSON
      }
    }

    message[key] = value;
  }

  return message;
}
