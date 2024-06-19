import { RedisArgument, Command, NumberReply } from '../RESP/types';
import { CommandParser } from '../client/parser';

export default {
  FIRST_KEY_INDEX: 1,
  IS_READ_ONLY: true,
  parseCommand(
    parser: CommandParser,
    key: RedisArgument,
    field: RedisArgument,
    value: RedisArgument
  ) {
    parser.push('HSETNX');
    parser.pushKey(key);
    parser.pushVariadic([field, value]);
  },
  transformArguments(
    key: RedisArgument,
    field: RedisArgument,
    value: RedisArgument
  ) { return [] },
  transformReply: undefined as unknown as () => NumberReply<0 | 1>
} as const satisfies Command;
