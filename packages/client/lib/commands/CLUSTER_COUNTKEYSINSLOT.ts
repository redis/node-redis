import { NumberReply, Command } from '../RESP/types';

export default {
  FIRST_KEY_INDEX: undefined,
  IS_READ_ONLY: true,
  transformArguments(slot: number) {
    return ['CLUSTER', 'COUNTKEYSINSLOT', slot.toString()];
  },
  transformReply: undefined as unknown as () => NumberReply
} as const satisfies Command;
