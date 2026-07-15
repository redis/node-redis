import { CommandParser } from '../client/parser';
import { RedisArgument, NumberReply, Command } from '../RESP/types';

export default {
  parseCommand(parser: CommandParser, channel: RedisArgument, message: RedisArgument) {
    parser.push('PUBLISH', channel, message);
  },
  transformReply: undefined as unknown as () => NumberReply,
} as const satisfies Command;
