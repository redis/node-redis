import { VerbatimStringReply, Command } from '@redis/client/dist/lib/RESP/types';

export default {
  FIRST_KEY_INDEX: undefined,
  IS_READ_ONLY: true,
  transformArguments() {
    return ['CLUSTER', 'INFO'];
  },
  transformReply: undefined as unknown as () => VerbatimStringReply
} as const satisfies Command;
