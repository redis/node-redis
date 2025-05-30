import { CommandParser } from '../client/parser';
import { RedisArgument, SimpleStringReply, Command } from '../RESP/types';

export default {
  NOT_KEYED_COMMAND: true,
  IS_READ_ONLY: true,
  /**
   * Reconfigures a node as a replica of the specified primary node
   * @param parser - The Redis command parser
   * @param nodeId - Node ID of the primary node to replicate
   */
  parseCommand(parser: CommandParser, nodeId: RedisArgument) {
    parser.push('CLUSTER', 'REPLICATE', nodeId);
  },
  transformReply: undefined as unknown as () => SimpleStringReply
} as const satisfies Command;
