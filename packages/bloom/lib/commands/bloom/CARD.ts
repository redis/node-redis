import { CommandParser } from '@redis/client/dist/lib/client/parser';
import { RedisArgument, NumberReply, Command } from '@redis/client/dist/lib/RESP/types';

export default {
  IS_READ_ONLY: true,
  parseCommand(parser: CommandParser, key: RedisArgument) {
    parser.push('BF.CARD');
    parser.pushKey(key);
  },
  transformReply: undefined as unknown as () => NumberReply
} as const satisfies Command;
