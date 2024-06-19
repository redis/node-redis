import { SimpleStringReply, Command } from '../RESP/types';
import { CommandParser } from '../client/parser';

export const ASKING_CMD = ['ASKING'];

export default {
  FIRST_KEY_INDEX: undefined,
  IS_READ_ONLY: true,
  parseCommand(parser: CommandParser) {
    parser.pushVariadic(ASKING_CMD);
  },
  transformArguments() { return [] },
  transformReply: undefined as unknown as () => SimpleStringReply<'OK'>
} as const satisfies Command;
