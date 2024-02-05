import { VerbatimStringReply, Command } from '../RESP/types';

export default {
  FIRST_KEY_INDEX: undefined,
  IS_READ_ONLY: true,
  transformArguments() {
    return ['CLUSTER', 'NODES'];
  },
  transformReply: undefined as unknown as () => VerbatimStringReply
} as const satisfies Command;
