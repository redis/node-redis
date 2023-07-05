import { ArrayReply, BlobStringReply, Command } from '@redis/client/dist/lib/RESP/types';

export default {
  FIRST_KEY_INDEX: undefined,
  IS_READ_ONLY: true,
  transformArguments() {
    return ['GRAPH.LIST'];
  },
  transformReply: undefined as unknown as () => ArrayReply<BlobStringReply>
} as const satisfies Command;
