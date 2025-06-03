import { CommandParser } from '../client/parser';
import { NumberReply, Command } from '../RESP/types';

export default {
  NOT_KEYED_COMMAND: true,
  IS_READ_ONLY: true,
  /**
   * Returns the client ID for the current connection
   * @param parser - The Redis command parser
   */
  parseCommand(parser: CommandParser) {
    parser.push('CLIENT', 'ID');
  },
  transformReply: undefined as unknown as () => NumberReply
} as const satisfies Command;
