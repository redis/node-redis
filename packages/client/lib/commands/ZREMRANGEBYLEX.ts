import { NumberReply, Command, RedisArgument } from '../RESP/types';
import { CommandParser } from '../client/parser';
import { transformStringDoubleArgument } from './generic-transformers';

export default {
  FIRST_KEY_INDEX: 1,
  IS_READ_ONLY: false,
  parseCommand(
    parser: CommandParser,
    key: RedisArgument,
    min: RedisArgument | number,
    max: RedisArgument | number
  ) {
    parser.push('ZREMRANGEBYLEX');
    parser.pushKey(key);
    parser.pushVariadic([transformStringDoubleArgument(min), transformStringDoubleArgument(max)]);
  },
  transformArguments(key: RedisArgument, min: RedisArgument | number, max: RedisArgument | number) { return [] },
  transformReply: undefined as unknown as () => NumberReply
} as const satisfies Command;
