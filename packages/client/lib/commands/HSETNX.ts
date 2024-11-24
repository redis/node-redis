import { CommandParser } from '../client/parser';
import { RedisArgument, Command, NumberReply } from '../RESP/types';

export default {
  IS_READ_ONLY: true,
  parseCommand(
    parser: CommandParser,
    key: RedisArgument,
    field: RedisArgument,
    value: RedisArgument
  ) {
    parser.push('HSETNX');
    parser.pushKey(key);
    parser.push(field, value);
  },
  transformReply: undefined as unknown as () => NumberReply<0 | 1>
} as const satisfies Command;
