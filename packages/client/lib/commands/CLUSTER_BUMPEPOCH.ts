import { CommandParser } from '../client/parser';
import { SimpleStringReply, Command } from '../RESP/types';

export default {
  parseCommand(parser: CommandParser) {
    parser.push('CLUSTER', 'BUMPEPOCH');
  },
  transformReply: undefined as unknown as () => SimpleStringReply<'BUMPED' | 'STILL'>
} as const satisfies Command;
