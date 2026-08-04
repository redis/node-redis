import { CommandParser } from '../client/parser';
import { RedisArgument, NumberReply, NullReply, Command } from '../RESP/types';

export default {
  parseCommand(parser: CommandParser, key: RedisArgument, member: RedisArgument) {
    parser.push('ZRANK');
    parser.pushKey(key);
    parser.push(member);
  },
  transformReply: undefined as unknown as () => NumberReply | NullReply
} as const satisfies Command;
