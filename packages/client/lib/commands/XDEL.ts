import { RedisArgument, NumberReply, Command } from '../RESP/types';
import { CommandParser } from '../client/parser';
import { RedisVariadicArgument } from './generic-transformers';

export default {
  FIRST_KEY_INDEX: 1,
  IS_READ_ONLY: false,
  parseCommand(parser: CommandParser, key: RedisArgument, id: RedisVariadicArgument) {
    parser.push('XDEL');
    parser.pushKey(key);
    parser.pushVariadic(id);
  },
  transformArguments(key: RedisArgument, id: RedisVariadicArgument) { return [] },
  transformReply: undefined as unknown as () => NumberReply
} as const satisfies Command;
