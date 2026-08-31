import { CommandParser } from '../client/parser';
import { SimpleStringReply, Command } from '../RESP/types';

export default {
  parseCommand(parser: CommandParser) {
    parser.push('CLUSTER', 'BUMPEPOCH');
  },
  // the reply is "BUMPED <epoch>" or "STILL <epoch>", not a bare literal
  transformReply: undefined as unknown as () => SimpleStringReply
} as const satisfies Command;
