import { CommandParser } from '../client/parser';
import { SimpleStringReply, Command } from '../RESP/types';

export default {
  NOT_KEYED_COMMAND: true,
  IS_READ_ONLY: true,
  parseCommand(parser: CommandParser, value: boolean) {
    parser.push(
      'CLIENT',
      'NO-TOUCH',
      value ? 'ON' : 'OFF'
    );
  },
  transformReply: undefined as unknown as () => SimpleStringReply<'OK'>
} as const satisfies Command;

