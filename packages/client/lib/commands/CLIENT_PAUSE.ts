import { CommandParser } from '../client/parser';
import { SimpleStringReply, Command } from '../RESP/types';

export default {
  NOT_KEYED_COMMAND: true,
  IS_READ_ONLY: true,
  /**
   * Stops the server from processing client commands for the specified duration
   * @param parser - The Redis command parser
   * @param timeout - Time in milliseconds to pause command processing
   * @param mode - Optional mode: 'WRITE' to pause only write commands, 'ALL' to pause all commands
   */
  parseCommand(parser: CommandParser, timeout: number, mode?: 'WRITE' | 'ALL') {
    parser.push('CLIENT', 'PAUSE', timeout.toString());
    if (mode) {
      parser.push(mode);
    }
  },
  transformReply: undefined as unknown as () => SimpleStringReply<'OK'>
} as const satisfies Command;
