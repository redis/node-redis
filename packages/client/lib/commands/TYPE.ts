import { CommandParser } from '../client/parser';
import { RedisArgument, SimpleStringReply, Command } from '../RESP/types';

export default {
  CACHEABLE: true,
  IS_READ_ONLY: true,
  parseCommand(parser: CommandParser, key: RedisArgument) {
    parser.push('TYPE');
    parser.pushKey(key);
  },
  transformReply: undefined as unknown as () => SimpleStringReply
} as const satisfies Command;
