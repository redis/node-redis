import { NumberReply, Command } from '../RESP/types';

export default {
  IS_READ_ONLY: true,
  transformArguments(slot: number) {
    return ['CLUSTER', 'COUNT-FAILURE-REPORTS', slot.toString()];
  },
  transformReply: undefined as unknown as () => NumberReply
} as const satisfies Command;
