import { BlobStringReply, Command } from '../RESP/types';

export default {
  IS_READ_ONLY: true,
  FIRST_KEY_INDEX: undefined,
  transformArguments() {
    return ['FUNCTION', 'DUMP'];
  },
  transformReply: undefined as unknown as () => BlobStringReply
} as const satisfies Command;
