import { CommandParser } from '@redis/client/dist/lib/client/parser';
import { RedisArgument, SimpleStringReply, Command } from '@redis/client/dist/lib/RESP/types';
import { FtSearchParams, parseParamsArgument } from './SEARCH';
import { DEFAULT_DIALECT } from '../dialect/default';

export interface FtExplainOptions {
  PARAMS?: FtSearchParams;
  DIALECT?: number;
}

export default {
  NOT_KEYED_COMMAND: true,
  IS_READ_ONLY: true,
  /**
   * Returns the execution plan for a complex query.
   * @param parser - The command parser
   * @param index - Name of the index to explain query against
   * @param query - The query string to explain
   * @param options - Optional parameters:
   *   - PARAMS: Named parameters to use in the query
   *   - DIALECT: Version of query dialect to use (defaults to 1)
   */
  parseCommand(
    parser: CommandParser,
    index: RedisArgument,
    query: RedisArgument,
    options?: FtExplainOptions
  ) {
    parser.push('FT.EXPLAIN', index, query);

    parseParamsArgument(parser, options?.PARAMS);

    if (options?.DIALECT) {
      parser.push('DIALECT', options.DIALECT.toString());
    } else {
      parser.push('DIALECT', DEFAULT_DIALECT);
    }
  },
  transformReply: undefined as unknown as () => SimpleStringReply
} as const satisfies Command;
