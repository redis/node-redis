import { CommandParser } from '../client/parser';
import { RedisArgument, ArrayReply, BlobStringReply, Command } from '../RESP/types';

export default {
  parseCommand(parser: CommandParser, nodeId: RedisArgument) {
    parser.push('CLUSTER', 'REPLICAS', nodeId);
  },
  transformReply: undefined as unknown as () => ArrayReply<BlobStringReply>
} as const satisfies Command;
