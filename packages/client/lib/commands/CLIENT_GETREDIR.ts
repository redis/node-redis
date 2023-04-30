import { NumberReply, Command } from '../RESP/types';

export default {
  IS_READ_ONLY: true,
  transformArguments() {
    return ['CLIENT', 'GETREDIR']
  },
  transformReply: undefined as unknown as () => NumberReply
} as const satisfies Command;
