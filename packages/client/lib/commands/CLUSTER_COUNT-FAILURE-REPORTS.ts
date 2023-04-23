import { RedisArgument, NumberReply, Command } from '../RESP/types';

export default {
  IS_READ_ONLY: true,
  transformArguments(nodeId: RedisArgument) {
    return ['CLUSTER', 'COUNT-FAILURE-REPORTS', nodeId];
  },
  transformReply: undefined as unknown as () => NumberReply
} as const satisfies Command;
