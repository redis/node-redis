import { CommandParser } from '../client/parser';
import { RedisArgument, NumberReply, Command } from '../RESP/types';
import { RedisVariadicArgument } from './generic-transformers';

export default {
  IS_READ_ONLY: false,
  parseCommand(parser: CommandParser, key: RedisArgument, id: RedisVariadicArgument) {
    parser.push('XDEL');
    parser.pushKey(key);
    parser.pushVariadic(id);
  },
  transformReply: undefined as unknown as () => NumberReply
} as const satisfies Command;
