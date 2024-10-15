import { ArrayReply, BlobStringReply, NumberReply, Command } from '../RESP/types';

export default {
  FIRST_KEY_INDEX: undefined,
  IS_READ_ONLY: true,
  transformArguments() {
    return ['LATENCY', 'LATEST'];
  },
  transformReply: undefined as unknown as () => ArrayReply<[
    name: BlobStringReply,
    timestamp: NumberReply,
    latestLatency: NumberReply,
    allTimeLatency: NumberReply
  ]>
} as const satisfies Command;

