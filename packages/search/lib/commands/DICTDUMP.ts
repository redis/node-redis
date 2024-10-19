import { CommandParser } from '@redis/client/lib/client/parser';
import { RedisArgument, ArrayReply, SetReply, BlobStringReply, Command } from '@redis/client/lib/RESP/types';

export default {
  NOT_KEYED_COMMAND: true,
  IS_READ_ONLY: true,
  parseCommand(parser: CommandParser, dictionary: RedisArgument) {
    parser.push('FT.DICTDUMP', dictionary);
  },
  transformReply: {
    2: undefined as unknown as () => ArrayReply<BlobStringReply>,
    3: undefined as unknown as () => SetReply<BlobStringReply>
  }
} as const satisfies Command;
