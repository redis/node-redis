import { RedisArgument, SimpleStringReply, Command } from '../RESP/types';
import { CommandParser } from '../client/parser';

export default {
  FIRST_KEY_INDEX: 1,
  IS_READ_ONLY: true,
  parseCommand(parser: CommandParser, key: RedisArgument, newKey: RedisArgument) {
    parser.push('RENAME');
    parser.pushKeys([key, newKey]);
  },
  transformArguments(key: RedisArgument, newKey: RedisArgument) { return [] },
  transformReply: undefined as unknown as () => SimpleStringReply
} as const satisfies Command;
