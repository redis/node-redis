import { NumberReply, Command } from '../RESP/types';
import { CommandParser } from '../client/parser';
import { RedisVariadicArgument } from './generic-transformers';

export default {
  FIRST_KEY_INDEX: undefined,
  IS_READ_ONLY: true,
  parseCommand(parser: CommandParser, username: RedisVariadicArgument) {
    parser.pushVariadic(['ACL', 'DELUSER']);
    parser.pushVariadic(username);
  },
  transformArguments(username: RedisVariadicArgument) { return []; },
  transformReply: undefined as unknown as () => NumberReply
} as const satisfies Command;
