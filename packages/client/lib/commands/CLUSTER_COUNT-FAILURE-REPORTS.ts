import { RedisArgument, NumberReply, Command } from '../RESP/types';

export default {
  FIRST_KEY_INDEX: undefined,
  IS_READ_ONLY: true,
  transformArguments(nodeId: RedisArgument) {
    return ['CLUSTER', 'COUNT-FAILURE-REPORTS', nodeId];
  },
  transformReply: undefined as unknown as () => NumberReply
} as const satisfies Command;
