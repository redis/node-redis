import { SimpleStringReply, Command } from '../RESP/types';

export default {
  IS_READ_ONLY: true,
  transformArguments(value: boolean) {
    return [
      'CLIENT',
      'CACHING',
      value ? 'YES' : 'NO'
    ];
  },
  transformReply: undefined as unknown as () => SimpleStringReply<'OK'>
} as const satisfies Command;
