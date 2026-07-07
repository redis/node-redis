import { CommandParser } from '../client/parser';
import { RedisArgument, NumberReply, Command } from '../RESP/types';

export default {
  IS_READ_ONLY: false,
  parseCommand(parser: CommandParser, key: RedisArgument, value: RedisArgument) {
    parser.push('APPEND');
    parser.pushKey(key);
    parser.push(value);
  },

  transformReply: undefined as unknown as () => NumberReply
} as const satisfies Command;
