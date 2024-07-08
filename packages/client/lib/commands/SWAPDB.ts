import { SimpleStringReply, Command } from '../RESP/types';
import { CommandParser } from '../client/parser';

export default {
  FIRST_KEY_INDEX: undefined,
  IS_READ_ONLY: false,
  parseCommand(parser: CommandParser, index1: number, index2: number) {
    parser.pushVariadic(['SWAPDB', index1.toString(), index2.toString()]);
  },
  transformArguments(index1: number, index2: number) { return [] },
  transformReply: undefined as unknown as () => SimpleStringReply<'OK'>
} as const satisfies Command;

