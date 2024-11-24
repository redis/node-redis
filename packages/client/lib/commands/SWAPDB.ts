import { CommandParser } from '../client/parser';
import { SimpleStringReply, Command } from '../RESP/types';

export default {
  NOT_KEYED_COMMAND: true,
  IS_READ_ONLY: false,
  parseCommand(parser: CommandParser, index1: number, index2: number) {
    parser.push('SWAPDB', index1.toString(), index2.toString());
  },
  transformReply: undefined as unknown as () => SimpleStringReply<'OK'>
} as const satisfies Command;

