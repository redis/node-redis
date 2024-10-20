import { CommandParser } from '../client/parser';
import { RedisArgument, SimpleStringReply, Command } from '../RESP/types';

export default {
  IS_READ_ONLY: true,
  parseCommand(parser: CommandParser, key: RedisArgument) {
    parser.setCachable();
    parser.push('TYPE');
    parser.pushKey(key);
  },
  transformReply: undefined as unknown as () => SimpleStringReply
} as const satisfies Command;
