import { CommandParser } from '../client/parser';
import { SimpleStringReply, Command } from '../RESP/types';

export default {
  NOT_KEYED_COMMAND: true,
  IS_READ_ONLY: true,
  /**
   * Removes hash slots from the current node in a Redis Cluster
   * @param parser - The Redis command parser
   * @param slots - One or more hash slots to be removed
   */
  parseCommand(parser: CommandParser, slots: number | Array<number>) {
    parser.push('CLUSTER', 'DELSLOTS');
    parser.pushVariadicNumber(slots);
  },
  transformReply: undefined as unknown as () => SimpleStringReply<'OK'>
} as const satisfies Command;
