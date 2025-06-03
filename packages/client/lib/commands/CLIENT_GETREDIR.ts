import { CommandParser } from '../client/parser';
import { NumberReply, Command } from '../RESP/types';

export default {
  NOT_KEYED_COMMAND: true,
  IS_READ_ONLY: true,
  /**
   * Returns the ID of the client to which the current client is redirecting tracking notifications
   * @param parser - The Redis command parser
   */
  parseCommand(parser: CommandParser) {
    parser.push('CLIENT', 'GETREDIR');
  },
  transformReply: undefined as unknown as () => NumberReply
} as const satisfies Command;
