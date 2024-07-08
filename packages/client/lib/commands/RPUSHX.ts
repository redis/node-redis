import { RedisArgument, NumberReply, Command } from '../RESP/types';
import { CommandParser } from '../client/parser';
import { RedisVariadicArgument } from './generic-transformers';

export default {
  FIRST_KEY_INDEX: 1,
  parseCommand(parser: CommandParser, key: RedisArgument, element: RedisVariadicArgument) {
    parser.push('RPUSHX');
    parser.pushKey(key);
    parser.pushVariadic(element);
  },
  transformArguments(key: RedisArgument, element: RedisVariadicArgument) { return [] },
  transformReply: undefined as unknown as () => NumberReply
} as const satisfies Command;
