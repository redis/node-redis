import { CommandParser } from '../client/parser';
import { RedisArgument, NumberReply, Command } from '../RESP/types';

export default {
  IS_READ_ONLY: true,
  parseCommand(parser: CommandParser, key: RedisArgument, count: number, element: RedisArgument) {
    parser.push('LREM');
    parser.pushKey(key);
    parser.push(count.toString());
    parser.push(element);
  },
  transformReply: undefined as unknown as () => NumberReply
} as const satisfies Command;
