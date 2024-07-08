import { RedisArgument, NumberReply, Command } from '../RESP/types';
import { CommandParser } from '../client/parser';

export default {
  FIRST_KEY_INDEX: undefined,
  IS_READ_ONLY: true,
  IS_FORWARD_COMMAND: true,
  parseCommand(parser: CommandParser, channel: RedisArgument, message: RedisArgument) {
    parser.pushVariadic(['PUBLISH', channel, message]);
  },
  transformArguments(channel: RedisArgument, message: RedisArgument) { return [] },
  transformReply: undefined as unknown as () => NumberReply
} as const satisfies Command;
