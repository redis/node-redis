import { CommandParser } from '../client/parser';
import { RedisArgument, SimpleStringReply, Command } from '../RESP/types';
import { RedisVariadicArgument } from './generic-transformers';

export default {
  NOT_KEYED_COMMAND: true,
  IS_READ_ONLY: true,
  /**
   * Creates or modifies ACL user with specified rules
   * @param parser - The Redis command parser
   * @param username - Username to create or modify
   * @param rule - ACL rule(s) to apply to the user
   */
  parseCommand(parser: CommandParser, username: RedisArgument, rule: RedisVariadicArgument) {
    parser.push('ACL', 'SETUSER', username);
    parser.pushVariadic(rule);
  },
  transformReply: undefined as unknown as () => SimpleStringReply<'OK'>
} as const satisfies Command;
