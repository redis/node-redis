import { CommandParser } from '../client/parser';
import { RedisArgument, SimpleStringReply, BlobStringReply, Command } from '../RESP/types';

export default {
  NOT_KEYED_COMMAND: true,
  IS_READ_ONLY: true,
  /**
   * Simulates ACL operations without executing them
   * @param parser - The Redis command parser
   * @param username - Username to simulate ACL operations for
   * @param command - Command arguments to simulate
   */
  parseCommand(parser: CommandParser, username: RedisArgument, command: Array<RedisArgument>) {
    parser.push('ACL', 'DRYRUN', username, ...command);
  },
  transformReply: undefined as unknown as () => SimpleStringReply<'OK'> | BlobStringReply
} as const satisfies Command;

