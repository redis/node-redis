import { CommandParser } from '../client/parser';
import { RedisArgument, NumberReply, Command } from '../RESP/types';
import { RedisVariadicArgument } from './generic-transformers';

export default {
  parseCommand(parser: CommandParser, key: RedisArgument, element: RedisVariadicArgument) {
    parser.push('RPUSH');
    parser.pushKey(key);
    parser.pushVariadic(element);
  },
  transformReply: undefined as unknown as () => NumberReply
} as const satisfies Command;
