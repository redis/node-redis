import { RedisArgument, SimpleStringReply, Command } from '../RESP/types';

export default {
  transformArguments(nodeId: RedisArgument) {
    return ['CLUSTER', 'REPLICATE', nodeId];
  },
  transformReply: undefined as unknown as () => SimpleStringReply
} as const satisfies Command;
