import { CommandParser } from '../client/parser';
import { RedisArgument, NumberReply, Command } from '../RESP/types';

export default {
  IS_READ_ONLY: true,
  parseCommand(parser: CommandParser, channel: RedisArgument, message: RedisArgument) {
    parser.push('SPUBLISH');
    parser.pushKey(channel);
    parser.push(message);
  },
  transformReply: undefined as unknown as () => NumberReply
} as const satisfies Command;
