import { SimpleStringReply, Command } from '../RESP/types';

export default {
  FIRST_KEY_INDEX: undefined,
  IS_READ_ONLY: true,
  transformArguments(value: boolean) {
    return [
      'CLIENT',
      'NO-TOUCH',
      value ? 'ON' : 'OFF'
    ];
  },
  transformReply: undefined as unknown as () => SimpleStringReply<'OK'>
} as const satisfies Command;

