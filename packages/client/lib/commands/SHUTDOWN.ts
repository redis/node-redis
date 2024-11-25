import { CommandParser } from '../client/parser';
import { SimpleStringReply, Command } from '../RESP/types';

export interface ShutdownOptions {
  mode?: 'NOSAVE' | 'SAVE';
  NOW?: boolean;
  FORCE?: boolean;
  ABORT?: boolean;
}

export default {
  NOT_KEYED_COMMAND: true,
  IS_READ_ONLY: false,
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
