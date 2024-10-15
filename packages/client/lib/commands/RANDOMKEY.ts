import { NumberReply, Command } from '../RESP/types';

export default {
  FIRST_KEY_INDEX: undefined,
  IS_READ_ONLY: true,
  transformArguments() {
    return ['RANDOMKEY'];
  },
  transformReply: undefined as unknown as () => NumberReply
} as const satisfies Command;
