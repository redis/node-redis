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
import { FtSearchParams, parseParamsArgument } from "./SEARCH";

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
  FILTER?: RedisArgument;
  YIELD_SCORE_AS?: RedisArgument;
}

export interface FtHybridCombineMethod {
  RRF?: {
    WINDOW?: number;
    CONSTANT?: number;
  };
  LINEAR?: {
    ALPHA?: number;
    BETA?: number;
    WINDOW?: number;
  };
  FUNCTION?: RedisArgument;
}

export interface FtHybridReducer {
  function: RedisArgument;
  nargs: number;
  args: Array<RedisArgument>;
  AS?: RedisArgument;
}

export interface FtHybridApply {
  expression: RedisArgument;
  AS?: RedisArgument;
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
    REDUCE?: FtHybridReducer | Array<FtHybridReducer>;
  };
  APPLY?: FtHybridApply | Array<FtHybridApply>;
  SORTBY?: {
    fields: Array<{
      field: RedisArgument;
      direction?: "ASC" | "DESC";
    }>;
  };
  NOSORT?: boolean;
  FILTER?: RedisArgument;
  LIMIT?: {
    offset: number | RedisArgument;
    count: number | RedisArgument;
  };
  PARAMS?: FtSearchParams;
  EXPLAINSCORE?: boolean;
  TIMEOUT?: number;
}

function parseSearchExpression(
  parser: CommandParser,
  search: FtHybridSearchExpression,
) {
  parser.push("SEARCH", search.query);

  if (search.SCORER) {
    parser.push("SCORER", search.SCORER.algorithm);
    if (search.SCORER.params) {
      parser.push(...search.SCORER.params);
    }
  }

  if (search.YIELD_SCORE_AS) {
    parser.push("YIELD_SCORE_AS", search.YIELD_SCORE_AS);
  }
}

function isParameterReference(value: RedisArgument): boolean {
  if (typeof value === "string" && value.startsWith("$")) {
    return true;
  }
  return false;
}

function parseVectorExpression(
  parser: CommandParser,
  vsim: FtHybridVectorExpression,
  isParamRef: boolean,
) {
  // If vectorData is a parameter reference (starts with $), use it directly
  // Otherwise, use the auto-generated $v parameter reference
  const vectorRef = isParamRef ? vsim.vectorData : "$v";
  parser.push("VSIM", vsim.field, vectorRef);

  if (vsim.method) {
    if (vsim.method.KNN) {
      const knn = vsim.method.KNN;
      // Calculate nargs: 2 base (K + value) + 2 per optional (EF_RUNTIME, YIELD_DISTANCE_AS)
      let nargs = 2;
      if (knn.EF_RUNTIME !== undefined) nargs += 2;
      if (knn.YIELD_DISTANCE_AS) nargs += 2;

      parser.push("KNN", nargs.toString(), "K", knn.K.toString());

      if (knn.EF_RUNTIME !== undefined) {
        parser.push("EF_RUNTIME", knn.EF_RUNTIME.toString());
      }

      if (knn.YIELD_DISTANCE_AS) {
        parser.push("YIELD_DISTANCE_AS", knn.YIELD_DISTANCE_AS);
      }
    }

    if (vsim.method.RANGE) {
      const range = vsim.method.RANGE;
      // Calculate nargs: 2 base (RADIUS + value) + 2 per optional (EPSILON, YIELD_DISTANCE_AS)
      let nargs = 2;
      if (range.EPSILON !== undefined) nargs += 2;
      if (range.YIELD_DISTANCE_AS) nargs += 2;

      parser.push("RANGE", nargs.toString(), "RADIUS", range.RADIUS.toString());

      if (range.EPSILON !== undefined) {
        parser.push("EPSILON", range.EPSILON.toString());
      }

      if (range.YIELD_DISTANCE_AS) {
        parser.push("YIELD_DISTANCE_AS", range.YIELD_DISTANCE_AS);
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
    // Calculate nargs: 2 per optional (WINDOW, CONSTANT, YIELD_SCORE_AS)
    let nargs = 0;
    if (rrf.WINDOW !== undefined) nargs += 2;
    if (rrf.CONSTANT !== undefined) nargs += 2;
    if (combine.YIELD_SCORE_AS) nargs += 2;

    parser.push("RRF", nargs.toString());

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
    // Calculate nargs: 2 per optional (ALPHA, BETA, WINDOW, YIELD_SCORE_AS)
    let nargs = 0;
    if (linear.ALPHA !== undefined) nargs += 2;
    if (linear.BETA !== undefined) nargs += 2;
    if (linear.WINDOW !== undefined) nargs += 2;
    if (combine.YIELD_SCORE_AS) nargs += 2;

    parser.push("LINEAR", nargs.toString());

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

  // Check if vectorData is a parameter reference (starts with $)
  const isVectorParamRef = options.VSIM
    ? isParameterReference(options.VSIM.vectorData)
    : false;

  if (options.VSIM) {
    parseVectorExpression(parser, options.VSIM, isVectorParamRef);
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
    // nargs is just the count of fields
    const sortByNargs = options.SORTBY.fields.reduce((acc, field) => {
      if (field.direction) {
        return acc + 2;
      }
      return acc + 1;
    }, 0);
    parser.push("SORTBY", sortByNargs.toString());
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

  // Merge vector data into PARAMS - vector must be passed as parameter 'v'
  // Only add 'v' to params if vectorData is NOT a parameter reference (e.g., "$vector")
  // When vectorData is a parameter reference, the user provides the actual vector in PARAMS
  const params: FtSearchParams = { ...options.PARAMS };
  if (options.VSIM && !isVectorParamRef) {
    params["v"] = options.VSIM.vectorData;
  }
  parseParamsArgument(
    parser,
    Object.keys(params).length > 0 ? params : undefined,
  );

  if (options.EXPLAINSCORE) {
    parser.push("EXPLAINSCORE");
  }

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
   *   - Tunable options: LIMIT, PARAMS, EXPLAINSCORE, TIMEOUT
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

    // Document ID comes from @__key field if loaded
    const docId = resultMap["__key"] ?? "";

    // The hybrid score field name is user-defined via COMBINE's YIELD_SCORE_AS
    // Common conventions are __hybrid_score, combined_score, etc.
    // We check for these common names but users should use YIELD_SCORE_AS and access the field directly
    // __score is the default score field returned by Redis when no custom YIELD_SCORE_AS is specified
    const doc: HybridSearchDocument = {
      id: docId,
      ...(resultMap["__score"] && { score: parseScore(resultMap["__score"]) }),
    };

    // Add all other fields from the result
    for (const [key, value] of Object.entries(resultMap)) {
      if (key === "__key") {
        continue; // Already handled as id and score
      }
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

function parseScore(value: any): number | undefined {
  if (value === undefined || value === null) {
    return undefined;
  }

  if (typeof value === "number") {
    return value;
  }

  if (typeof value === "string") {
    return Number.parseFloat(value);
  }

  return undefined;
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
