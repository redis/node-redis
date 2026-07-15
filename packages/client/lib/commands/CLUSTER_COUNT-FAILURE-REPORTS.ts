import { CommandParser } from '../client/parser';
import { RedisArgument, NumberReply, Command } from '../RESP/types';

export default {
  parseCommand(parser: CommandParser, nodeId: RedisArgument) {
    parser.push('CLUSTER', 'COUNT-FAILURE-REPORTS', nodeId);
  },
  transformReply: undefined as unknown as () => NumberReply
} as const satisfies Command;
