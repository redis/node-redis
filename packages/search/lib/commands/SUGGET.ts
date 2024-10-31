import { CommandParser } from '@redis/client/lib/client/parser';
import { NullReply, ArrayReply, BlobStringReply, Command, RedisArgument } from '@redis/client/lib/RESP/types';

export interface FtSugGetOptions {
  FUZZY?: boolean;
  MAX?: number;
}

export default {
  IS_READ_ONLY: true,
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
