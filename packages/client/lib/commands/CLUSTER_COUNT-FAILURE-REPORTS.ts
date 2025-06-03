import { CommandParser } from '../client/parser';
import { RedisArgument, NumberReply, Command } from '../RESP/types';

export default {
  NOT_KEYED_COMMAND: true,
  IS_READ_ONLY: true,
  /**
   * Returns the number of failure reports for a given node
   * @param parser - The Redis command parser
   * @param nodeId - The ID of the node to check
   */
  parseCommand(parser: CommandParser, nodeId: RedisArgument) {
    parser.push('CLUSTER', 'COUNT-FAILURE-REPORTS', nodeId);
  },
  transformReply: undefined as unknown as () => NumberReply
} as const satisfies Command;
