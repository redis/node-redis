import { CommandParser } from '../client/parser';
import { RedisArgument, SimpleStringReply, Command } from '../RESP/types';

export default {
  parseCommand(parser: CommandParser, nodeId: RedisArgument) {
    parser.push('CLUSTER', 'REPLICATE', nodeId);
  },
  transformReply: undefined as unknown as () => SimpleStringReply
} as const satisfies Command;
