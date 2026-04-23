import { CommandParser } from '../client/parser';
import { RedisArgument, NumberReply, Command } from '../RESP/types';

export default {
  parseCommand(parser: CommandParser, key: RedisArgument, offset: number, value: RedisArgument) {
    parser.push('SETRANGE');
    parser.pushKey(key);
    parser.push(offset.toString(), value);
  },
  transformReply: undefined as unknown as () => NumberReply
} as const satisfies Command;
