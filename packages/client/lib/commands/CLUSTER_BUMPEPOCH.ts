import { SimpleStringReply, Command } from '../RESP/types';

export default {
  FIRST_KEY_INDEX: undefined,
  IS_READ_ONLY: true,
  transformArguments() {
    return ['CLUSTER', 'BUMPEPOCH'];
  },
  transformReply: undefined as unknown as () => SimpleStringReply<'BUMPED' | 'STILL'>
} as const satisfies Command;
