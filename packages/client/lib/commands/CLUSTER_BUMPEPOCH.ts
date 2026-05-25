import { CommandParser } from '../client/parser';
import { SimpleStringReply, Command } from '../RESP/types';

export default {
  NOT_KEYED_COMMAND: true,
  IS_READ_ONLY: true,
  parseCommand(parser: CommandParser) {
    parser.push('CLUSTER', 'BUMPEPOCH');
  },
  transformReply: undefined as unknown as () => SimpleStringReply<'BUMPED' | 'STILL'>
} as const satisfies Command;
