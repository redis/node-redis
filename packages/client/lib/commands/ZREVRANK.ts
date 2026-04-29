import { CommandParser } from '../client/parser';
import { NumberReply, NullReply, Command, RedisArgument } from '../RESP/types';

export default {
  CACHEABLE: true,
  IS_READ_ONLY: true,
  parseCommand(parser: CommandParser, key: RedisArgument, member: RedisArgument) {
    parser.push('ZREVRANK');
    parser.pushKey(key);
    parser.push(member);
  },
  transformReply: undefined as unknown as () => NumberReply | NullReply
} as const satisfies Command;
