import { CommandParser } from '../client/parser';
import { NumberReply, Command, RedisArgument } from '../RESP/types';

export default {
  IS_READ_ONLY: true,
  parseCommand(parser: CommandParser, key: RedisArgument, member: RedisArgument) {
    parser.setCachable();
    parser.push('SISMEMBER');
    parser.pushKey(key);
    parser.push(member);
  },
  transformReply: undefined as unknown as () => NumberReply
} as const satisfies Command;
