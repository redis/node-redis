import { CommandParser } from '../client/parser';
import { SimpleStringReply, Command } from '../RESP/types';

export default {
  NOT_KEYED_COMMAND: true,
  IS_READ_ONLY: true,
  /**
   * Sets the configuration epoch for a Redis Cluster node
   * @param parser - The Redis command parser
   * @param configEpoch - The configuration epoch to set
   */
  parseCommand(parser: CommandParser, configEpoch: number) {
    parser.push('CLUSTER', 'SET-CONFIG-EPOCH', configEpoch.toString());
  },
  transformReply: undefined as unknown as () => SimpleStringReply<'OK'>
} as const satisfies Command;
