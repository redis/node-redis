import { CommandParser } from '../client/parser';
import { SimpleStringReply, Command } from '../RESP/types';

export default {
  NOT_KEYED_COMMAND: true,
  IS_READ_ONLY: true,
  /**
   * Saves the current ACL configuration to the ACL file
   * @param parser - The Redis command parser
   */
  parseCommand(parser: CommandParser) {
    parser.push('ACL', 'SAVE');
  },
  transformReply: undefined as unknown as () => SimpleStringReply<'OK'>
} as const satisfies Command;
