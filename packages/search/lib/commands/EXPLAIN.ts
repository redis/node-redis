import { CommandParser } from '@redis/client/dist/lib/client/parser';
import { RedisArgument, SimpleStringReply, Command } from '@redis/client/dist/lib/RESP/types';
import { FtSearchParams, parseParamsArgument } from './SEARCH';
import { DEFAULT_DIALECT } from '../dialect/default';

export interface FtExplainOptions {
  PARAMS?: FtSearchParams;
  DIALECT?: number;
}

export default {
  // Keyless read: replica-safe, but the metadata-derived isReplicaSafe
  // returns false for keyless commands, so opt in explicitly (restores the
  // pre-derivation master behavior).
  IS_READ_ONLY: true,
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
