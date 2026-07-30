import { CommandParser } from '../client/parser';
import { RedisArgument, SimpleStringReply, Command } from '../RESP/types';

export default {
  parseCommand(parser: CommandParser, key: RedisArgument, newKey: RedisArgument) {
    parser.push('RENAME');
    parser.pushKeys([key, newKey]);
  },
  transformReply: undefined as unknown as () => SimpleStringReply
} as const satisfies Command;
