import { CommandParser } from '../client/parser';
import { SimpleStringReply, Command } from '../RESP/types';

export default {
  parseCommand(parser: CommandParser) {
    parser.push('CLUSTER', 'SAVECONFIG');
  },
  transformReply: undefined as unknown as () => SimpleStringReply<'OK'>
} as const satisfies Command;

