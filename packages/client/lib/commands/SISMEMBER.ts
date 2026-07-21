import { CommandParser } from '../client/parser';
import { NumberReply, Command, RedisArgument } from '../RESP/types';

export default {
  parseCommand(parser: CommandParser, key: RedisArgument, member: RedisArgument) {
    parser.push('SISMEMBER');
    parser.pushKey(key);
    parser.push(member);
  },
  transformReply: undefined as unknown as () => NumberReply
} as const satisfies Command;
