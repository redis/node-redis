import { CommandParser } from '@redis/client/dist/lib/client/parser';
import { NullReply, ArrayReply, BlobStringReply, Command, RedisArgument } from '@redis/client/dist/lib/RESP/types';

export interface FtSugGetOptions {
  FUZZY?: boolean;
  MAX?: number;
}

export default {
  IS_READ_ONLY: true,
  /**
   * Gets completion suggestions for a prefix from a suggestion dictionary.
   * @param parser - The command parser
   * @param key - The suggestion dictionary key
   * @param prefix - The prefix to get completion suggestions for
   * @param options - Optional parameters:
   *   - FUZZY: Enable fuzzy prefix matching
   *   - MAX: Maximum number of results to return
   */
  parseCommand(parser: CommandParser, key: RedisArgument, prefix: RedisArgument, options?: FtSugGetOptions) {
    parser.push('FT.SUGGET');
    parser.pushKey(key);
    parser.push(prefix);

    if (options?.FUZZY) {
      parser.push('FUZZY');
    }

    if (options?.MAX !== undefined) {
      parser.push('MAX', options.MAX.toString());
    }
  },
  transformReply: undefined as unknown as () => NullReply | ArrayReply<BlobStringReply>
} as const satisfies Command;
