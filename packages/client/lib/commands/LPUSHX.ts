import { CommandParser } from '../client/parser';
import { RedisArgument, NumberReply, Command } from '../RESP/types';
import { RedisVariadicArgument } from './generic-transformers';

export default {
  parseCommand(parser: CommandParser, key: RedisArgument, elements: RedisVariadicArgument) {
    parser.push('LPUSHX');
    parser.pushKey(key);
    parser.pushVariadic(elements);
  },
  transformReply: undefined as unknown as () => NumberReply
} as const satisfies Command;
