import { CommandParser } from '@redis/client/lib/client/parser';
import { ArrayReply, BlobStringReply, SetReply, Command } from '@redis/client/lib/RESP/types';
import { RedisVariadicArgument } from '@redis/client/lib/commands/generic-transformers';

export default {
  NOT_KEYED_COMMAND: true,
  IS_READ_ONLY: true,
  parseCommand(parser: CommandParser, filter: RedisVariadicArgument) {
    parser.push('TS.QUERYINDEX');
    parser.pushVariadic(filter);
  },
  transformReply: {
    2: undefined as unknown as () => ArrayReply<BlobStringReply>,
    3: undefined as unknown as () => SetReply<BlobStringReply>
  }
} as const satisfies Command;
