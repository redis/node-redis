import { CommandParser } from '@redis/client/dist/lib/client/parser';
import { RedisArgument, ArrayReply, BlobStringReply, Command } from '@redis/client/dist/lib/RESP/types';
import { DEFAULT_DIALECT } from '../dialect/default';

export interface FtExplainCLIOptions {
  DIALECT?: number;
}

export default {
  NOT_KEYED_COMMAND: true,
  IS_READ_ONLY: true,
  /**
   * Returns the execution plan for a complex query in a more verbose format than FT.EXPLAIN.
   * @param parser - The command parser
   * @param index - Name of the index to explain query against
   * @param query - The query string to explain
   * @param options - Optional parameters:
   *   - DIALECT: Version of query dialect to use (defaults to 1)
   */
  parseCommand(
    parser: CommandParser, 
    index: RedisArgument, 
    query: RedisArgument,
    options?: FtExplainCLIOptions
  ) {
    parser.push('FT.EXPLAINCLI', index, query);

    if (options?.DIALECT) {
      parser.push('DIALECT', options.DIALECT.toString());
    } else {
      parser.push('DIALECT', DEFAULT_DIALECT);
    }
  },
  transformReply: undefined as unknown as () => ArrayReply<BlobStringReply>
} as const satisfies Command;
