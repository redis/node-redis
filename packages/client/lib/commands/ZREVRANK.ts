import { CommandParser } from '../client/parser';
import { NumberReply, NullReply, Command, RedisArgument } from '../RESP/types';

export default {
  IS_READ_ONLY: true,
  parseCommand(parser: CommandParser, key: RedisArgument, member: RedisArgument) {
    parser.setCachable();
    parser.push('ZREVRANK');
    parser.pushKey(key);
    parser.push(member);
  },
  transformReply: undefined as unknown as () => NumberReply | NullReply
} as const satisfies Command;
