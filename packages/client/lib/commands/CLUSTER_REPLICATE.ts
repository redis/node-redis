import { RedisArgument, SimpleStringReply, Command } from '../RESP/types';
import { CommandParser } from '../client/parser';

export default {
  FIRST_KEY_INDEX: undefined,
  IS_READ_ONLY: true,
  parseCommand(parser: CommandParser, nodeId: RedisArgument) {
    parser.pushVariadic(['CLUSTER', 'REPLICATE', nodeId]);
  },
  transformArguments(nodeId: RedisArgument) { return [] },
  transformReply: undefined as unknown as () => SimpleStringReply
} as const satisfies Command;
