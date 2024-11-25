import { CommandParser } from '../client/parser';
import { RedisArgument, NumberReply, Command } from '../RESP/types';
import { RedisVariadicArgument } from './generic-transformers';

export default {
  IS_READ_ONLY: true,
  parseCommand(parser: CommandParser, key: RedisArgument, element?: RedisVariadicArgument) {
    parser.push('PFADD')
    parser.pushKey(key);
    if (element) {
      parser.pushVariadic(element);
    }
  },
  transformReply: undefined as unknown as () => NumberReply
} as const satisfies Command;
