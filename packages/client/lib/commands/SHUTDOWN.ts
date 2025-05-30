import { CommandParser } from '../client/parser';
import { SimpleStringReply, Command } from '../RESP/types';

/**
 * Options for the SHUTDOWN command
 * 
 * @property mode - NOSAVE will not save DB, SAVE will force save DB
 * @property NOW - Immediately terminate all clients
 * @property FORCE - Force shutdown even in case of errors
 * @property ABORT - Abort a shutdown in progress
 */
export interface ShutdownOptions {
  mode?: 'NOSAVE' | 'SAVE';
  NOW?: boolean;
  FORCE?: boolean;
  ABORT?: boolean;
}

export default {
  NOT_KEYED_COMMAND: true,
  IS_READ_ONLY: false,
  /**
   * Constructs the SHUTDOWN command
   * 
   * @param parser - The command parser
   * @param options - Options for the shutdown process
   * @see https://redis.io/commands/shutdown/
   */
  parseCommand(parser: CommandParser, options?: ShutdownOptions) {
    parser.push('SHUTDOWN');

    if (options?.mode) {
      parser.push(options.mode);
    }

    if (options?.NOW) {
      parser.push('NOW');
    }

    if (options?.FORCE) {
      parser.push('FORCE');
    }

    if (options?.ABORT) {
      parser.push('ABORT');
    }
  },
  transformReply: undefined as unknown as () => void | SimpleStringReply
} as const satisfies Command;
