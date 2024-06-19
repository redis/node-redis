import { RedisArgument, NumberReply, Command } from '../RESP/types';
import { CommandParser } from '../client/parser';

export default {
  FIRST_KEY_INDEX: 1,
  IS_READ_ONLY: true,
  parseCommand(parser: CommandParser, key: RedisArgument, field: RedisArgument) {
    parser.setCachable();
    parser.push('HEXISTS');
    parser.pushKey(key);
    parser.push(field);
  },
  transformArguments(key: RedisArgument, field: RedisArgument) { return [] },
  transformReply: undefined as unknown as () => NumberReply<0 | 1>
} as const satisfies Command;
