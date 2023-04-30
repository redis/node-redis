import { SimpleStringReply, Command } from '../RESP/types';

export default {
  transformArguments() {
    return ['CONFIG', 'REWRITE'];
  },
  transformReply: undefined as unknown as () => SimpleStringReply
} as const satisfies Command;
