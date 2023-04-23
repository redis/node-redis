import { SimpleStringReply, Command } from '../RESP/types';

export default {
  IS_READ_ONLY: true,
  transformArguments() {
    return ['CLUSTER', 'BUMPEPOCH'];
  },
  transformReply: undefined as unknown as () => SimpleStringReply<'BUMPED' | 'STILL'>
} as const satisfies Command;
