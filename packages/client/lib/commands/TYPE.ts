import { CommandParser } from '../client/parser';
import { RedisArgument, SimpleStringReply, Command } from '../RESP/types';

export default {
  parseCommand(parser: CommandParser, key: RedisArgument) {
    parser.push('TYPE');
    parser.pushKey(key);
  },
  transformReply: undefined as unknown as () => SimpleStringReply
} as const satisfies Command;
