import { RedisArgument, SimpleStringReply, Command } from '../RESP/types';
import { CommandParser } from '../client/parser';
import { RedisVariadicArgument } from './generic-transformers';

export default {
  FIRST_KEY_INDEX: undefined,
  IS_READ_ONLY: true,
  parseCommand(parser: CommandParser, username: RedisArgument, rule: RedisVariadicArgument) {
    parser.pushVariadic(['ACL', 'SETUSER', username]);
    parser.pushVariadic(rule);
  },
  transformArguments(username: RedisArgument, rule: RedisVariadicArgument) { return [] },
  transformReply: undefined as unknown as () => SimpleStringReply<'OK'>
} as const satisfies Command;
