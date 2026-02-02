import { CommandParser } from "@redis/client/dist/lib/client/parser";
import {
  RedisArgument,
  Command,
  ReplyUnion,
} from "@redis/client/dist/lib/RESP/types";
import HYBRID, { FtHybridOptions } from "./HYBRID";

export interface FtHybridWithCursorOptions extends FtHybridOptions {
  COUNT?: number;
  MAXIDLE?: number;
}

export interface HybridWithCursorReply {
  warnings: string[];
  searchCursor: number;
  vsimCursor: number;
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

export default {
  NOT_KEYED_COMMAND: HYBRID.NOT_KEYED_COMMAND,
  IS_READ_ONLY: HYBRID.IS_READ_ONLY,
  /**
   * Performs a hybrid search with a cursor for retrieving large result sets.
   *
   * @experimental
   * NOTE: FT.Hybrid is still in experimental state
   * It's behaviour and function signature may change
   *
   * @param parser - The command parser
   * @param index - Name of the index to query
   * @param options - Optional parameters:
   *   - All options supported by FT.HYBRID
   *   - COUNT: Number of results to return per cursor fetch
   *   - MAXIDLE: Maximum idle time for cursor in milliseconds
   */
  parseCommand(
    parser: CommandParser,
    index: RedisArgument,
    options?: FtHybridWithCursorOptions,
  ) {
    HYBRID.parseCommand(parser, index, options);
    parser.push("WITHCURSOR");

    if (options?.COUNT !== undefined) {
      parser.push("COUNT", options.COUNT.toString());
    }

    if (options?.MAXIDLE !== undefined) {
      parser.push("MAXIDLE", options.MAXIDLE.toString());
    }
  },
  transformReply: {
    2: (reply: any): HybridWithCursorReply => {
      // Parse flat array reply: ['SEARCH', cursor_id, 'VSIM', cursor_id, 'warnings', [...]]
      const replyMap = parseReplyMap(reply);

      return {
        warnings: replyMap["warnings"] ?? [],
        searchCursor: replyMap["SEARCH"] ?? Number.NaN,
        vsimCursor: replyMap["VSIM"] ?? Number.NaN,
      };
    },
    3: undefined as unknown as () => ReplyUnion,
  },
  unstableResp3: true,
} as const satisfies Command;
