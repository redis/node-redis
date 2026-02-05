import { CommandParser } from "@redis/client/dist/lib/client/parser";
import {
  RedisArgument,
  Command,
  ReplyUnion,
} from "@redis/client/dist/lib/RESP/types";
import {
  RedisVariadicArgument,
  parseOptionalVariadicArgument,
} from "@redis/client/dist/lib/commands/generic-transformers";
import { parseParamsArgument } from "./SEARCH";

/**
 * Text search expression configuration for hybrid search.
 */
export interface FtHybridSearchExpression {
  /** Search query string or parameter reference (e.g., "$q") */
  query: RedisArgument;
  /** Scoring algorithm configuration */
  SCORER?: RedisArgument;
  /** Alias for the text search score in results */
  YIELD_SCORE_AS?: RedisArgument;
}

/**
 * Vector search method configuration - either KNN or RANGE.
 */
export const FT_HYBRID_VECTOR_METHOD = {
  /** K-Nearest Neighbors search configuration */
  KNN: "KNN",
  /** Range-based vector search configuration */
  RANGE: "RANGE",
} as const;

/** Vector search method type */
export type FtHybridVectorMethodType =
  (typeof FT_HYBRID_VECTOR_METHOD)[keyof typeof FT_HYBRID_VECTOR_METHOD];

interface FtHybridVectorMethodKNN {
  type: (typeof FT_HYBRID_VECTOR_METHOD)["KNN"];
  /** Number of nearest neighbors to find */
  K: number;
  /** Controls the search accuracy vs. speed tradeoff */
  EF_RUNTIME?: number;
}

interface FtHybridVectorMethodRange {
  type: (typeof FT_HYBRID_VECTOR_METHOD)["RANGE"];
  /** Maximum distance for matches */
  RADIUS: number;
  /** Provides additional precision control */
  EPSILON?: number;
}

/**
 * Vector similarity search expression configuration.
 */
export interface FtHybridVectorExpression {
  /** Vector field name (e.g., "@embedding") */
  field: RedisArgument;
  /** Vector parameter reference (e.g., "$v") */
  vector: string;
  /** Search method configuration - KNN or RANGE */
  method?: FtHybridVectorMethodKNN | FtHybridVectorMethodRange;
  /** Pre-filter expression applied before vector search (e.g., "@tag:{foo}") */
  FILTER?: RedisArgument;
  /** Alias for the vector score in results */
  YIELD_SCORE_AS?: RedisArgument;
}

/**
 * Score fusion method configuration for combining search results.
 * Only one method should be specified: RRF, LINEAR, or FUNCTION.
 */
export interface FtHybridCombineMethod {
  /** Reciprocal Rank Fusion configuration */
  RRF?: {
    /** RRF window size (default: 20) */
    WINDOW?: number;
    /** RRF constant (default: 60) */
    CONSTANT?: number;
  };
  /** Linear weighted combination configuration */
  LINEAR?: {
    /** Weight for text search score (default: 0.3) */
    ALPHA?: number;
    /** Weight for vector search score (default: 0.7) */
    BETA?: number;
    /** Window size for score normalization */
    WINDOW?: number;
  };
  /** Custom scoring function expression */
  FUNCTION?: RedisArgument;
}

/**
 * Reducer configuration for GROUPBY aggregation.
 */
export interface FtHybridReducer {
  /** Reducer function name (e.g., "COUNT", "SUM", "AVG") */
  function: RedisArgument;
  /** Number of arguments for the reducer */
  nargs: number;
  /** Arguments for the reducer function */
  args: Array<RedisArgument>;
  /** Alias for the reducer result in output */
  AS?: RedisArgument;
}

/**
 * Apply expression for result transformation.
 */
export interface FtHybridApply {
  /** Transformation expression to apply */
  expression: RedisArgument;
  /** Alias for the computed value in output */
  AS?: RedisArgument;
}

/**
 * Options for the FT.HYBRID command.
 */
export interface FtHybridOptions {
  /** Text search expression configuration */
  SEARCH: FtHybridSearchExpression;
  /** Vector similarity search expression configuration */
  VSIM: FtHybridVectorExpression;
  /** Score fusion configuration for combining SEARCH and VSIM results */
  COMBINE?: {
    /** Fusion method: RRF, LINEAR, or FUNCTION */
    method: FtHybridCombineMethod;
    /** Alias for the combined score in results */
    YIELD_SCORE_AS?: RedisArgument;
  };
  /** Fields to load and return in results (LOAD clause) */
  LOAD?: RedisVariadicArgument;
  /** Group by configuration for aggregation */
  GROUPBY?: {
    /** Fields to group by */
    fields: RedisVariadicArgument;
    /** Reducer(s) to apply to each group */
    REDUCE?: FtHybridReducer | Array<FtHybridReducer>;
  };
  /** Apply expression(s) for result transformation */
  APPLY?: FtHybridApply | Array<FtHybridApply>;
  /** Sort configuration for results */
  SORTBY?: {
    /** Fields to sort by with optional direction */
    fields: Array<{
      /** Field name to sort by */
      field: RedisArgument;
      /** Sort direction: "ASC" (ascending) or "DESC" (descending) */
      direction?: "ASC" | "DESC";
    }>;
  };
  /** Disable sorting - returns results in arbitrary order */
  NOSORT?: boolean;
  /** Post-filter expression applied after scoring */
  FILTER?: RedisArgument;
  /** Pagination configuration */
  LIMIT?: {
    /** Number of results to skip */
    offset: number | RedisArgument;
    /** Number of results to return */
    count: number | RedisArgument;
  };
  /** Query parameters for parameterized queries */
  PARAMS: Record<string, string | number | Buffer>;
  /** Query timeout in milliseconds */
  TIMEOUT?: number;
}

function parseSearchExpression(
  parser: CommandParser,
  search: FtHybridSearchExpression,
) {
  parser.push("SEARCH", search.query);

  if (search.SCORER) {
    parser.push("SCORER", search.SCORER);
  }

  if (search.YIELD_SCORE_AS) {
    parser.push("YIELD_SCORE_AS", search.YIELD_SCORE_AS);
  }
}

function parseVectorExpression(
  parser: CommandParser,
  vsim: FtHybridVectorExpression,
) {
  parser.push("VSIM", vsim.field, vsim.vector);

  if (vsim.method) {
    if (vsim.method.type === FT_HYBRID_VECTOR_METHOD.KNN) {
      let argsCount = 2;
      if (vsim.method.EF_RUNTIME !== undefined) {
        argsCount += 2;
      }

      parser.push("KNN", argsCount.toString(), "K", vsim.method.K.toString());

      if (vsim.method.EF_RUNTIME !== undefined) {
        parser.push("EF_RUNTIME", vsim.method.EF_RUNTIME.toString());
      }
    }

    if (vsim.method.type === FT_HYBRID_VECTOR_METHOD.RANGE) {
      let argsCount = 2;
      if (vsim.method.EPSILON !== undefined) {
        argsCount += 2;
      }

      parser.push(
        "RANGE",
        argsCount.toString(),
        "RADIUS",
        vsim.method.RADIUS.toString(),
      );

      if (vsim.method.EPSILON !== undefined) {
        parser.push("EPSILON", vsim.method.EPSILON.toString());
      }
    }
  }

  if (vsim.FILTER) {
    parser.push("FILTER", vsim.FILTER);
  }

  if (vsim.YIELD_SCORE_AS) {
    parser.push("YIELD_SCORE_AS", vsim.YIELD_SCORE_AS);
  }
}

function parseCombineMethod(
  parser: CommandParser,
  combine: FtHybridOptions["COMBINE"],
) {
  if (!combine) return;

  parser.push("COMBINE");

  if (combine.method.RRF) {
    const rrf = combine.method.RRF;

    // Calculate argsCount: 2 per optional (WINDOW, CONSTANT, YIELD_SCORE_AS)
    let argsCount = 0;
    if (rrf.WINDOW !== undefined) {
      argsCount += 2;
    }
    if (rrf.CONSTANT !== undefined) {
      argsCount += 2;
    }
    if (combine.YIELD_SCORE_AS) {
      argsCount += 2;
    }

    parser.push("RRF", argsCount.toString());

    if (rrf.WINDOW !== undefined) {
      parser.push("WINDOW", rrf.WINDOW.toString());
    }

    if (rrf.CONSTANT !== undefined) {
      parser.push("CONSTANT", rrf.CONSTANT.toString());
    }

    if (combine.YIELD_SCORE_AS) {
      parser.push("YIELD_SCORE_AS", combine.YIELD_SCORE_AS);
    }
  }

  if (combine.method.LINEAR) {
    const linear = combine.method.LINEAR;

    // Calculate argsCount: 2 per optional (ALPHA, BETA, WINDOW, YIELD_SCORE_AS)
    let argsCount = 0;
    if (linear.ALPHA !== undefined) {
      argsCount += 2;
    }
    if (linear.BETA !== undefined) {
      argsCount += 2;
    }
    if (linear.WINDOW !== undefined) {
      argsCount += 2;
    }
    if (combine.YIELD_SCORE_AS) {
      argsCount += 2;
    }

    parser.push("LINEAR", argsCount.toString());

    if (linear.ALPHA !== undefined) {
      parser.push("ALPHA", linear.ALPHA.toString());
    }

    if (linear.BETA !== undefined) {
      parser.push("BETA", linear.BETA.toString());
    }

    if (linear.WINDOW !== undefined) {
      parser.push("WINDOW", linear.WINDOW.toString());
    }

    if (combine.YIELD_SCORE_AS) {
      parser.push("YIELD_SCORE_AS", combine.YIELD_SCORE_AS);
    }
  }

  if (combine.method.FUNCTION) {
    parser.push("FUNCTION", combine.method.FUNCTION);
  }
}

function parseReducer(parser: CommandParser, reducer: FtHybridReducer) {
  parser.push("REDUCE", reducer.function, reducer.nargs.toString());
  parser.push(...reducer.args);
  if (reducer.AS) {
    parser.push("AS", reducer.AS);
  }
}

function parseApply(parser: CommandParser, apply: FtHybridApply) {
  parser.push("APPLY", apply.expression);
  if (apply.AS) {
    parser.push("AS", apply.AS);
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

  parseOptionalVariadicArgument(parser, "LOAD", options.LOAD);

  if (options.GROUPBY) {
    parseOptionalVariadicArgument(parser, "GROUPBY", options.GROUPBY.fields);

    if (options.GROUPBY.REDUCE) {
      const reducers = Array.isArray(options.GROUPBY.REDUCE)
        ? options.GROUPBY.REDUCE
        : [options.GROUPBY.REDUCE];

      for (const reducer of reducers) {
        parseReducer(parser, reducer);
      }
    }
  }

  if (options.APPLY) {
    const applies = Array.isArray(options.APPLY)
      ? options.APPLY
      : [options.APPLY];

    for (const apply of applies) {
      parseApply(parser, apply);
    }
  }

  if (options.SORTBY) {
    const sortByArgsCount = options.SORTBY.fields.reduce((acc, field) => {
      if (field.direction) {
        return acc + 2;
      }
      return acc + 1;
    }, 0);

    parser.push("SORTBY", sortByArgsCount.toString());
    for (const sortField of options.SORTBY.fields) {
      parser.push(sortField.field);
      if (sortField.direction) {
        parser.push(sortField.direction);
      }
    }
  }

  if (options.NOSORT) {
    parser.push("NOSORT");
  }

  if (options.FILTER) {
    parser.push("FILTER", options.FILTER);
  }

  if (options.LIMIT) {
    parser.push(
      "LIMIT",
      options.LIMIT.offset.toString(),
      options.LIMIT.count.toString(),
    );
  }

  const hasParams = options.PARAMS && Object.keys(options.PARAMS).length > 0;

  parseParamsArgument(parser, hasParams ? options.PARAMS : undefined);

  if (options.TIMEOUT !== undefined) {
    parser.push("TIMEOUT", options.TIMEOUT.toString());
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
   *   - Tunable options: LIMIT, PARAMS, TIMEOUT
   */
  parseCommand(
    parser: CommandParser,
    index: RedisArgument,
    options?: FtHybridOptions,
  ) {
    parser.push("FT.HYBRID", index);

    parseHybridOptions(parser, options);
  },
  transformReply: {
    2: (reply: any): HybridSearchResult => {
      return transformHybridSearchResults(reply);
    },
    3: undefined as unknown as () => ReplyUnion,
  },
  unstableResp3: true,
} as const satisfies Command;

export interface HybridSearchResult {
  totalResults: number;
  executionTime: number;
  warnings: string[];
  results: HybridSearchDocument[];
}

export interface HybridSearchDocument {
  id: string;
  score?: number | undefined;
  [field: string]: any;
}

function transformHybridSearchResults(reply: any): HybridSearchResult {
  // FT.HYBRID returns a map-like structure as flat array:
  // ['total_results', N, 'results', [...], 'warnings', [...], 'execution_time', 'X.XXX']
  const replyMap = parseReplyMap(reply);

  const totalResults = replyMap["total_results"] ?? 0;
  const rawResults = replyMap["results"] ?? [];
  const warnings = replyMap["warnings"] ?? [];
  const executionTime = replyMap["execution_time"]
    ? Number.parseFloat(replyMap["execution_time"])
    : 0;

  const results: HybridSearchDocument[] = [];
  for (const result of rawResults) {
    // Each result is a flat key-value array like FT.AGGREGATE: ['field1', 'value1', 'field2', 'value2', ...]
    const resultMap = parseReplyMap(result);

    const doc = Object.create(null);

    // Add all other fields from the result
    for (const [key, value] of Object.entries(resultMap)) {
      if (key === "$") {
        // JSON document - parse and merge
        try {
          Object.assign(doc, JSON.parse(value as string));
        } catch {
          doc[key] = value;
        }
      } else {
        doc[key] = value;
      }
    }

    results.push(doc);
  }

  return {
    totalResults,
    executionTime,
    warnings,
    results,
  };
}

function parseReplyMap(reply: any): Record<string, any> {
  const map: Record<string, any> = {};

  if (!Array.isArray(reply)) {
    return map;
  }

  for (let i = 0; i < reply.length; i += 2) {
    const key = reply[i];
    const value = reply[i + 1];
    if (typeof key === "string") {
      map[key] = value;
    }
  }

  return map;
}
