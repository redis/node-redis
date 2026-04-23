import { CommandParser } from '../client/parser';
import { RedisArgument, Command, ArrayReply } from '../RESP/types';

export default {
  IS_READ_ONLY: false,
  parseCommand(parser: CommandParser, key: RedisArgument, count: number) {
    parser.push('SPOP');
    parser.pushKey(key);
    parser.push(count.toString());
  },
  transformReply: undefined as unknown as () => ArrayReply<string>
} as const satisfies Command;
