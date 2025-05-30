import { CommandParser } from '../client/parser';
import { SimpleStringReply, Command } from '../RESP/types';

export default {
  NOT_KEYED_COMMAND: true,
  IS_READ_ONLY: true,
  /**
   * Instructs the server about tracking or not keys in the next request
   * @param parser - The Redis command parser
   * @param value - Whether to enable (true) or disable (false) tracking
   */
  parseCommand(parser: CommandParser, value: boolean) {
    parser.push(
      'CLIENT',
      'CACHING',
      value ? 'YES' : 'NO'
    );
  },
  transformReply: undefined as unknown as () => SimpleStringReply<'OK'>
} as const satisfies Command;
