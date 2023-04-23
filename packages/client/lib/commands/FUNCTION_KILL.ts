import { SimpleStringReply, Command } from '../RESP/types';

export default {
  IS_READ_ONLY: true,
  FIRST_KEY_INDEX: undefined,
  transformArguments() {
    return ['FUNCTION', 'KILL'];
  },
  transformReply: undefined as unknown as () => SimpleStringReply
} as const satisfies Command;
