import { CommandParser } from '../client/parser';
import { NumberReply, Command } from '../RESP/types';

export default {
  parseCommand(parser: CommandParser, fieldset: string) {
    parser.push('HIMPORT', 'DISCARD', fieldset);
  },
  transformReply: undefined as unknown as () => NumberReply
} as const satisfies Command;
