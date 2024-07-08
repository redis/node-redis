import { RedisArgument, NumberReply, Command } from '../RESP/types';
import { CommandParser } from '../client/parser';

export default {
  FIRST_KEY_INDEX: 1,
  IS_READ_ONLY: true,
  parseCommand(parser: CommandParser, channel: RedisArgument, message: RedisArgument) {
    parser.push('SPUBLISH');
    parser.pushKey(channel);
    parser.push(message);
  },
  transformArguments(channel: RedisArgument, message: RedisArgument) { return [] },
  transformReply: undefined as unknown as () => NumberReply
} as const satisfies Command;
