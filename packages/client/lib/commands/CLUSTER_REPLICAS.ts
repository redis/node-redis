import { RedisArgument, VerbatimStringReply, Command } from '@redis/client/dist/lib/RESP/types';

export default {
  FIRST_KEY_INDEX: undefined,
  IS_READ_ONLY: true,
  transformArguments(nodeId: RedisArgument) {
    return ['CLUSTER', 'REPLICAS', nodeId];
  },
  transformReply: undefined as unknown as () => VerbatimStringReply
} as const satisfies Command;
