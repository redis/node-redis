import { CommandParser } from '../client/parser';
import { ArrayReply, BlobStringReply, Command } from '../RESP/types';

export default {
  NOT_KEYED_COMMAND: true,
  IS_READ_ONLY: true,
  /**
   * Returns a list of all configured ACL usernames
   * @param parser - The Redis command parser
   */
  parseCommand(parser: CommandParser) {
    parser.push('ACL', 'USERS');
  },
  transformReply: undefined as unknown as () => ArrayReply<BlobStringReply>
} as const satisfies Command;
