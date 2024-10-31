import { CommandParser } from '../client/parser';
import { RedisArgument, NumberReply, Command } from '../RESP/types';

export default {
  IS_READ_ONLY: false,
  parseCommand(parser: CommandParser, key: RedisArgument, group: RedisArgument) {
    parser.push('XGROUP', 'DESTROY');
    parser.pushKey(key);
    parser.push(group);
  },
  transformReply: undefined as unknown as () => NumberReply
} as const satisfies Command;
