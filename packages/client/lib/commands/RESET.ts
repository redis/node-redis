import { CommandParser } from '../client/parser';
import { SimpleStringReply, Command } from '../RESP/types';

export default {
  NOT_KEYED_COMMAND: true,
  IS_READ_ONLY: true,
  /**
   * Performs a full reset of the connection state: discards any pending
   * transaction (`MULTI`), unsubscribes from every channel/pattern, exits
   * client tracking and monitor modes, selects database `0`, and resets
   * `CLIENT TRACKINGINFO` and `CLIENT REPLY` state, among others.
   *
   * @param parser - The command parser
   * @see https://redis.io/commands/reset/
   */
  parseCommand(parser: CommandParser) {
    parser.push('RESET');
  },
  transformReply: undefined as unknown as () => SimpleStringReply<'RESET'>
} as const satisfies Command;
