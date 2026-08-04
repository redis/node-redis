import { CommandParser } from '../client/parser';
import { RedisArgument, SimpleStringReply, Command } from '../RESP/types';
import { RedisVariadicArgument } from './generic-transformers';

export default {
  parseCommand(parser: CommandParser, username: RedisArgument, rule: RedisVariadicArgument) {
    parser.push('ACL', 'SETUSER', username);
    parser.pushVariadic(rule);
  },
  transformReply: undefined as unknown as () => SimpleStringReply<'OK'>
} as const satisfies Command;
