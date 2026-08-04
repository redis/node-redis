import { CommandParser } from '../client/parser';
import { RedisArgument, SimpleStringReply, Command } from '../RESP/types';

export default {
  parseCommand(parser: CommandParser, library: RedisArgument) {
    parser.push('FUNCTION', 'DELETE', library);
  },
  transformReply: undefined as unknown as () => SimpleStringReply
} as const satisfies Command;
