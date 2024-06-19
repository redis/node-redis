import { SimpleStringReply, Command } from '../RESP/types';
import { CommandParser } from '../client/parser';

export default {
  FIRST_KEY_INDEX: undefined,
  IS_READ_ONLY: true,
  parseCommand(parser: CommandParser, slots: number | Array<number>) {
    parser.pushVariadic(['CLUSTER', 'DELSLOTS']);
    parser.pushVariadicNumber(slots);
  },
  transformArguments(slots: number | Array<number>) { return [] },
  transformReply: undefined as unknown as () => SimpleStringReply<'OK'>
} as const satisfies Command;
