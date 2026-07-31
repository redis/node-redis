import { CommandParser } from '../client/parser';
import { SimpleStringReply, Command } from '../RESP/types';

export default {
  parseCommand(parser: CommandParser, slots: number | Array<number>) {
    parser.push('CLUSTER', 'ADDSLOTS');
    parser.pushVariadicNumber(slots);
  },
  transformReply: undefined as unknown as () => SimpleStringReply<'OK'>
} as const satisfies Command;
