import { RedisArgument, NumberReply, Command } from '../RESP/types';
import { CommandParser } from '../client/parser';

export default {
  FIRST_KEY_INDEX: 1,
  IS_READ_ONLY: false,
  parseCommand(parser: CommandParser, source: RedisArgument, destination: RedisArgument, member: RedisArgument) {
    parser.push('SMOVE');
    parser.pushKeys([source, destination]);
    parser.push(member);
  },
  transformArguments(source: RedisArgument, destination: RedisArgument, member: RedisArgument) { return [] },
  transformReply: undefined as unknown as () => NumberReply
} as const satisfies Command;
