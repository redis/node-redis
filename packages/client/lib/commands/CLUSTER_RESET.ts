import { CommandParser } from '../client/parser';
import { SimpleStringReply, Command } from '../RESP/types';

export interface ClusterResetOptions {
  mode?: 'HARD' | 'SOFT';
}

export default {
  NOT_KEYED_COMMAND: true,
  IS_READ_ONLY: true,
  /**
   * Resets a Redis Cluster node, clearing all information and returning it to a brand new state
   * @param parser - The Redis command parser
   * @param options - Options for the reset operation
   */
  parseCommand(parser: CommandParser, options?: ClusterResetOptions) {
    parser.push('CLUSTER', 'RESET');

    if (options?.mode) {
      parser.push(options.mode);
    }
  },
  transformReply: undefined as unknown as () => SimpleStringReply<'OK'>
} as const satisfies Command;
