import { SimpleStringReply, Command } from '../RESP/types';

export default {
  transformArguments() {
    return ['CONFIG', 'RESETSTAT'];
  },
  transformReply: undefined as unknown as () => SimpleStringReply
} as const satisfies Command;
