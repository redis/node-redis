import { CommandParser } from '@redis/client/lib/client/parser';
import { RedisArgument, NumberReply, Command } from '@redis/client/lib/RESP/types';

export default {
  IS_READ_ONLY: true,
  parseCommand(parser: CommandParser, key: RedisArgument) {
    parser.push('FT.SUGLEN', key);
  },
  transformReply: undefined as unknown as () => NumberReply
} as const satisfies Command;
