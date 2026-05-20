import { CommandParser } from '../client/parser';
import { NumberReply, Command, RedisArgument } from '../RESP/types';
import { RedisVariadicArgument } from './generic-transformers';

export default {
  parseCommand(
    parser: CommandParser,
    key: RedisArgument,
    size: number | string,
    values: RedisVariadicArgument
  ) {
    parser.push('ARRING');
    parser.pushKey(key);
    parser.push(size.toString());
    parser.pushVariadic(values);
  },
  transformReply: undefined as unknown as () => NumberReply
} as const satisfies Command;
