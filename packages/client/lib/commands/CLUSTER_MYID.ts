import { BlobStringReply, Command } from "../RESP/types";

export default {
  transformArguments() {
    return ['CLUSTER', 'MYID'];
  },
  transformReply: undefined as unknown as () => BlobStringReply
} as const satisfies Command;
