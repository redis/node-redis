import { CommandParser } from '../client/parser';
import { RedisArgument, NumberReply, Command } from '../RESP/types';
import { transformStringDoubleArgument } from './generic-transformers';

export default {
  IS_READ_ONLY: true,
  parseCommand(
    parser: CommandParser, 
    key: RedisArgument,
    min: number | RedisArgument,
    max: number | RedisArgument
  ) {
    parser.setCachable();
    parser.push('ZCOUNT');
    parser.pushKey(key);
    parser.push(
      transformStringDoubleArgument(min), 
      transformStringDoubleArgument(max)
    );
  },
  transformReply: undefined as unknown as () => NumberReply
} as const satisfies Command;
