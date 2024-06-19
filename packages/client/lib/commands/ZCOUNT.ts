import { RedisArgument, NumberReply, Command } from '../RESP/types';
import { CommandParser } from '../client/parser';
import { transformStringDoubleArgument } from './generic-transformers';

export default {
  FIRST_KEY_INDEX: 1,
  IS_READ_ONLY: true,
  parseCommand(
    parser: CommandParser, 
    key: RedisArgument,
    min: number | RedisArgument,
    max: number | RedisArgument
  ) {
    parser.setCachable();
    parser.push('ZCOUNT');
    parser.push(key);
    parser.pushVariadic(
      [
        transformStringDoubleArgument(min), 
        transformStringDoubleArgument(max)
      ]
    );
  },
  transformArguments(
    key: RedisArgument,
    min: number | RedisArgument,
    max: number | RedisArgument
  ) { return [] },
  transformReply: undefined as unknown as () => NumberReply
} as const satisfies Command;
