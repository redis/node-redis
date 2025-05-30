import { CommandParser } from '../client/parser';
import { SimpleStringReply, Command } from '../RESP/types';

export default {
  /**
   * Discards a transaction, forgetting all queued commands
   * @param parser - The Redis command parser
   */
  parseCommand(parser: CommandParser) {
    parser.push('DISCARD');
  },
  transformReply: undefined as unknown as () => SimpleStringReply
} as const satisfies Command;
