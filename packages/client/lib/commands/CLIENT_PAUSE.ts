import { SimpleStringReply, Command } from '../RESP/types';

export default {
  FIRST_KEY_INDEX: undefined,
  IS_READ_ONLY: true,
  transformArguments(timeout: number, mode?: 'WRITE' | 'ALL') {
    const args = [
      'CLIENT',
      'PAUSE',
      timeout.toString()
    ];

    if (mode) {
      args.push(mode);
    }

    return args;
  },
  transformReply: undefined as unknown as () => SimpleStringReply<'OK'>
} as const satisfies Command;
