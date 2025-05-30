import { CommandParser } from '../client/parser';
import { SimpleStringReply, Command } from '../RESP/types';
import ACL_LOG from './ACL_LOG';

export default {
  NOT_KEYED_COMMAND: true,
  IS_READ_ONLY: ACL_LOG.IS_READ_ONLY,
  /**
   * Clears the ACL security events log
   * @param parser - The Redis command parser
   */
  parseCommand(parser: CommandParser) {
    parser.push('ACL', 'LOG', 'RESET');
  },
  transformReply: undefined as unknown as () => SimpleStringReply<'OK'>
} as const satisfies Command;
