import { CommandParser } from '../client/parser';
import { VerbatimStringReply, Command } from '../RESP/types';

export default {
  NOT_KEYED_COMMAND: true,
  IS_READ_ONLY: true,
  /**
   * Returns serialized information about the nodes in a Redis Cluster
   * @param parser - The Redis command parser
   */
  parseCommand(parser: CommandParser) {
    parser.push('CLUSTER', 'NODES');
  },
  transformReply: undefined as unknown as () => VerbatimStringReply
} as const satisfies Command;
