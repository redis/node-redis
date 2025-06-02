import { CommandParser } from '@redis/client/dist/lib/client/parser';
import { ArrayReply, BlobStringReply, SetReply, Command } from '@redis/client/dist/lib/RESP/types';
import { RedisVariadicArgument } from '@redis/client/dist/lib/commands/generic-transformers';

export default {
  NOT_KEYED_COMMAND: true,
  IS_READ_ONLY: true,
  /**
   * Queries the index for time series matching a specific filter
   * @param parser - The command parser
   * @param filter - Filter to match time series labels
   */
  parseCommand(parser: CommandParser, filter: RedisVariadicArgument) {
    parser.push('TS.QUERYINDEX');
    parser.pushVariadic(filter);
  },
  transformReply: {
    2: undefined as unknown as () => ArrayReply<BlobStringReply>,
    3: undefined as unknown as () => SetReply<BlobStringReply>
  }
} as const satisfies Command;
