import { RedisArgument, NumberReply, Command } from '../RESP/types';
import { CommandParser } from '../client/parser';
import { RedisVariadicArgument } from './generic-transformers';

export default {
  FIRST_KEY_INDEX: 1,
  parseCommand(parser: CommandParser, key: RedisArgument, elements: RedisVariadicArgument) {
    parser.push('LPUSH');
    parser.pushKey(key);
    parser.pushVariadic(elements);
  },
  transformArguments(key: RedisArgument, elements: RedisVariadicArgument) { return [] },
  transformReply: undefined as unknown as () => NumberReply
} as const satisfies Command;
