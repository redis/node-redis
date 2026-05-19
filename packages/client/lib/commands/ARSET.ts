import { CommandParser } from '../client/parser';
import { RedisArgument, NumberReply, Command } from '../RESP/types';

export default {
  parseCommand(
    parser: CommandParser,
    key: RedisArgument,
    index: number | string,
    value: RedisArgument | Array<RedisArgument>
  ) {
    parser.push('ARSET');
    parser.pushKey(key);
    parser.push(index.toString());
    if (Array.isArray(value)) {
      parser.push(...value);
    } else {
      parser.push(value);
    }
  },
  transformReply: undefined as unknown as () => NumberReply<0 | 1>
} as const satisfies Command;
