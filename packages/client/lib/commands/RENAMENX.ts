import { CommandParser } from '../client/parser';
import { RedisArgument, NumberReply, Command } from '../RESP/types';

export default {
  parseCommand(parser: CommandParser, key: RedisArgument, newKey: RedisArgument) {
    parser.push('RENAMENX');
    parser.pushKeys([key, newKey]);
  },
  transformReply: undefined as unknown as () => NumberReply
} as const satisfies Command;
