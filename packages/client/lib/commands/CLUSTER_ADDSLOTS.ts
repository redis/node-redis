import { CommandParser } from '../client/parser';
import { SimpleStringReply, Command } from '../RESP/types';

export default {
  NOT_KEYED_COMMAND: true,
  IS_READ_ONLY: true,
  /**
   * Assigns hash slots to the current node in a Redis Cluster
   * @param parser - The Redis command parser
   * @param slots - One or more hash slots to be assigned
   */
  parseCommand(parser: CommandParser, slots: number | Array<number>) {
    parser.push('CLUSTER', 'ADDSLOTS');
    parser.pushVariadicNumber(slots);
  },
  transformReply: undefined as unknown as () => SimpleStringReply<'OK'>
} as const satisfies Command;
