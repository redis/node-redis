import { RedisArgument, NumberReply, Command } from '../RESP/types';
import { CommandParser } from '../client/parser';

export default {
  FIRST_KEY_INDEX: 1,
  IS_READ_ONLY: true,
  parseCommand(parser: CommandParser, key: RedisArgument, count: number, element: RedisArgument) {
    parser.push('LREM');
    parser.pushKey(key);
    parser.push(count.toString());
    parser.push(element);
  },
  transformArguments(key: RedisArgument, count: number, element: RedisArgument) { return [] },
  transformReply: undefined as unknown as () => NumberReply
} as const satisfies Command;
