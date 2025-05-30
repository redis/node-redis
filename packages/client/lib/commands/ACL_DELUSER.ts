import { CommandParser } from '../client/parser';
import { NumberReply, Command } from '../RESP/types';
import { RedisVariadicArgument } from './generic-transformers';

export default {
  NOT_KEYED_COMMAND: true,
  IS_READ_ONLY: true,
  /**
   * Deletes one or more users from the ACL
   * @param parser - The Redis command parser
   * @param username - Username(s) to delete
   */
  parseCommand(parser: CommandParser, username: RedisVariadicArgument) {
    parser.push('ACL', 'DELUSER');
    parser.pushVariadic(username);
  },
  transformReply: undefined as unknown as () => NumberReply
} as const satisfies Command;
