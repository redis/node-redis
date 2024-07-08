import { RedisArgument, NumberReply, Command } from '../RESP/types';
import { CommandParser } from '../client/parser';

export default {
  FIRST_KEY_INDEX: 1,
  IS_READ_ONLY: true,
  parseCommand(
    parser: CommandParser,
    key: RedisArgument,
    min: RedisArgument,
    max: RedisArgument
  ) {
    parser.setCachable();
    parser.push('ZLEXCOUNT');
    parser.pushKey(key);
    parser.push(min);
    parser.push(max);
  },
  transformArguments(
    key: RedisArgument,
    min: RedisArgument,
    max: RedisArgument
  ) { return [] },
  transformReply: undefined as unknown as () => NumberReply
} as const satisfies Command;
