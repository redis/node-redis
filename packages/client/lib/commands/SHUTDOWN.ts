import { SimpleStringReply, Command } from '../RESP/types';
import { CommandParser } from '../client/parser';

export interface ShutdownOptions {
  mode?: 'NOSAVE' | 'SAVE';
  NOW?: boolean;
  FORCE?: boolean;
  ABORT?: boolean;
}

export default {
  FIRST_KEY_INDEX: undefined,
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
  transformArguments(options?: ShutdownOptions) { return [] },
  transformReply: undefined as unknown as () => void | SimpleStringReply
} as const satisfies Command;
