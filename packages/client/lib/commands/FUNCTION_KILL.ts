import { SimpleStringReply, Command } from '../RESP/types';

export default {
  FIRST_KEY_INDEX: undefined,
  IS_READ_ONLY: true,
  transformArguments() {
    return ['FUNCTION', 'KILL'];
  },
  transformReply: undefined as unknown as () => SimpleStringReply
} as const satisfies Command;
