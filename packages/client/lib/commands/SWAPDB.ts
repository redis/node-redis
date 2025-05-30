import { CommandParser } from '../client/parser';
import { SimpleStringReply, Command } from '../RESP/types';

export default {
  NOT_KEYED_COMMAND: true,
  IS_READ_ONLY: false,
  /**
   * Swaps the data of two Redis databases.
   * @param parser - The Redis command parser.
   * @param index1 - First database index.
   * @param index2 - Second database index.
   */
  parseCommand(parser: CommandParser, index1: number, index2: number) {
    parser.push('SWAPDB', index1.toString(), index2.toString());
  },
  transformReply: undefined as unknown as () => SimpleStringReply<'OK'>
} as const satisfies Command;

