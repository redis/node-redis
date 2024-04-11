import { SimpleStringReply, Command } from '../RESP/types';

export interface ShutdownOptions {
  mode?: 'NOSAVE' | 'SAVE';
  NOW?: boolean;
  FORCE?: boolean;
  ABORT?: boolean;
}

export default {
  FIRST_KEY_INDEX: undefined,
  IS_READ_ONLY: false,
  transformArguments(options?: ShutdownOptions) {
    const args = ['SHUTDOWN']

    if (options?.mode) {
      args.push(options.mode);
    }

    if (options?.NOW) {
      args.push('NOW');
    }

    if (options?.FORCE) {
      args.push('FORCE');
    }

    if (options?.ABORT) {
      args.push('ABORT');
    }

    return args;
  },
  transformReply: undefined as unknown as () => void | SimpleStringReply
} as const satisfies Command;
