import { NumberReply, Command } from '../RESP/types';

export default {
  IS_READ_ONLY: true,
  FIRST_KEY_INDEX: undefined,
  transformArguments() {
    return ['PUBSUB', 'NUMPAT'];
  },
  transformReply: undefined as unknown as () => NumberReply
} as const satisfies Command;
