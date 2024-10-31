import { CommandParser } from '@redis/client/lib/client/parser';
import { RedisArgument, NumberReply, Command } from '@redis/client/lib/RESP/types';

export default {
  IS_READ_ONLY: true,
  parseCommand(parser: CommandParser, key: RedisArgument, item: RedisArgument) {
    parser.push('CF.COUNT');
    parser.pushKey(key);
    parser.push(item);
  },
  transformReply: undefined as unknown as () => NumberReply
} as const satisfies Command;
