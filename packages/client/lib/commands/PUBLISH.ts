import { CommandParser } from '../client/parser';
import { RedisArgument, NumberReply, Command } from '../RESP/types';

export default {
  NOT_KEYED_COMMAND: true,
  IS_READ_ONLY: true,
  IS_FORWARD_COMMAND: true,
  parseCommand(parser: CommandParser, channel: RedisArgument, message: RedisArgument) {
    parser.push('PUBLISH', channel, message);
  },
  transformReply: undefined as unknown as () => NumberReply
} as const satisfies Command;
