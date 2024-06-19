import { SimpleStringReply, Command } from '../RESP/types';
import { CommandParser } from '../client/parser';

export default {
  FIRST_KEY_INDEX: undefined,
  IS_READ_ONLY: true,
  parseCommand(parser: CommandParser, value: boolean) {
    parser.pushVariadic(
      [
        'CLIENT',
        'CACHING',
        value ? 'YES' : 'NO'
      ]
    );
  },
  transformArguments(value: boolean) { return [] },
  transformReply: undefined as unknown as () => SimpleStringReply<'OK'>
} as const satisfies Command;
