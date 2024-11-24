import { CommandParser } from '../client/parser';
import { RedisArgument, NumberReply, Command } from '../RESP/types';

export default {
  CACHEABLE: true,
  IS_READ_ONLY: true,
  parseCommand(parser: CommandParser, key: RedisArgument) {
    parser.push('STRLEN');
    parser.pushKey(key);
  },
  transformReply: undefined as unknown as () => NumberReply
} as const satisfies Command;
