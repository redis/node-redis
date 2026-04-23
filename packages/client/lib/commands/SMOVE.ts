import { CommandParser } from '../client/parser';
import { RedisArgument, NumberReply, Command } from '../RESP/types';

export default {
  IS_READ_ONLY: false,
  parseCommand(parser: CommandParser, source: RedisArgument, destination: RedisArgument, member: RedisArgument) {
    parser.push('SMOVE');
    parser.pushKeys([source, destination]);
    parser.push(member);
  },
  transformReply: undefined as unknown as () => NumberReply
} as const satisfies Command;
