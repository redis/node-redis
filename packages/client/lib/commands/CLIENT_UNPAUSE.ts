import { SimpleStringReply, Command } from '../RESP/types';

export default {
  IS_READ_ONLY: true,
  transformArguments() {
    return ['CLIENT', 'UNPAUSE'];
  },
  transformReply: undefined as unknown as () => SimpleStringReply<'OK'>
} as const satisfies Command;
