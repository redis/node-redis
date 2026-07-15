import { CommandParser } from '../client/parser';
import { SimpleStringReply, Command } from '../RESP/types';

export const ASKING_CMD = 'ASKING';

export default {
  parseCommand(parser: CommandParser) {
    parser.push(ASKING_CMD);
  },
  transformReply: undefined as unknown as () => SimpleStringReply<'OK'>
} as const satisfies Command;
