import { NumberReply, NullReply, Command, RedisArgument } from '../RESP/types';
import { CommandParser } from '../client/parser';

export default {
  FIRST_KEY_INDEX: 1,
  IS_READ_ONLY: true,
  parseCommand(parser: CommandParser, key: RedisArgument, member: RedisArgument) {
    parser.setCachable();
    parser.push('ZREVRANK');
    parser.pushKey(key);
    parser.push(member);
  },
  transformArguments(key: RedisArgument, member: RedisArgument) { return [] },
  transformReply: undefined as unknown as () => NumberReply | NullReply
} as const satisfies Command;
