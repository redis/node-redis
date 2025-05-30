import { CommandParser } from '../client/parser';
import { BlobStringReply, Command } from '../RESP/types';

export default {
  NOT_KEYED_COMMAND: true,
  IS_READ_ONLY: true,
  /**
   * Returns the username of the current connection
   * @param parser - The Redis command parser
   */
  parseCommand(parser: CommandParser) {
    parser.push('ACL', 'WHOAMI');
  },
  transformReply: undefined as unknown as () => BlobStringReply
} as const satisfies Command;
