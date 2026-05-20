import { CommandParser } from '../client/parser';
import { RedisArgument, NumberReply, Command } from '../RESP/types';
import { RedisVariadicArgument } from './generic-transformers';

export default {
  parseCommand(
    parser: CommandParser,
    key: RedisArgument,
    index: number | string,
    value: RedisVariadicArgument
  ) {
    parser.push('ARSET');
    parser.pushKey(key);
    parser.push(index.toString());
    parser.pushVariadic(value);
  },
  transformReply: undefined as unknown as () => NumberReply
} as const satisfies Command;
