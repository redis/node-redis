import { CommandParser } from '../client/parser';
import { RedisArgument, SimpleStringReply, Command } from '../RESP/types';

export default {
  parseCommand(parser: CommandParser, name: RedisArgument) {
    parser.push('MODULE', 'UNLOAD', name);
  },
  transformReply: undefined as unknown as () => SimpleStringReply<'OK'>
} as const satisfies Command;
