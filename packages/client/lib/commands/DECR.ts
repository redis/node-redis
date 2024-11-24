import { CommandParser } from '../client/parser';
import { RedisArgument, NumberReply, Command } from '../RESP/types';

export default {
  parseCommand(parser: CommandParser, key: RedisArgument) {
    parser.push('DECR');
    parser.pushKey(key);
  },
  transformReply: undefined as unknown as () => NumberReply
} as const satisfies Command;
