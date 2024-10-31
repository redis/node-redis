import { CommandParser } from '../client/parser';
import { RedisArgument, NumberReply, Command } from '../RESP/types';
import { RedisVariadicArgument } from './generic-transformers';

export default {
  parseCommand(parser: CommandParser, key: RedisArgument, field: RedisVariadicArgument) {
    parser.push('HDEL');
    parser.pushKey(key);
    parser.pushVariadic(field);
  },
  transformReply: undefined as unknown as () => NumberReply
} as const satisfies Command;
