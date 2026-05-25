import { CommandParser } from '../client/parser';
import { NumberReply, Command, RedisArgument } from '../RESP/types';
import { RedisVariadicArgument } from './generic-transformers';

export default {
  IS_READ_ONLY: false,
  parseCommand(parser: CommandParser, key: RedisArgument, members: RedisVariadicArgument) {
    parser.push('SREM');
    parser.pushKey(key);
    parser.pushVariadic(members);
  },
  transformReply: undefined as unknown as () => NumberReply
} as const satisfies Command;
