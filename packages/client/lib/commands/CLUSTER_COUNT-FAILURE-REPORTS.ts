import { RedisArgument, NumberReply, Command } from '../RESP/types';
import { CommandParser } from '../client/parser';

export default {
  FIRST_KEY_INDEX: undefined,
  IS_READ_ONLY: true,
  parseCommand(parser: CommandParser, nodeId: RedisArgument) {
    parser.pushVariadic(['CLUSTER', 'COUNT-FAILURE-REPORTS', nodeId]);
  },
  transformArguments(nodeId: RedisArgument) { return [] },
  transformReply: undefined as unknown as () => NumberReply
} as const satisfies Command;
