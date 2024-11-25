import { CommandParser } from '../client/parser';
import { RedisArgument, NumberReply, Command } from '../RESP/types';

export default {
  CACHEABLE: true,
  IS_READ_ONLY: true,
  parseCommand(
    parser: CommandParser,
    key: RedisArgument,
    min: RedisArgument,
    max: RedisArgument
  ) {
    parser.push('ZLEXCOUNT');
    parser.pushKey(key);
    parser.push(min);
    parser.push(max);
  },
  transformReply: undefined as unknown as () => NumberReply
} as const satisfies Command;
