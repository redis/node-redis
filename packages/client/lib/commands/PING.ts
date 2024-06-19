import { RedisArgument, SimpleStringReply, BlobStringReply, Command } from '../RESP/types';
import { CommandParser } from '../client/parser';

export default {
  FIRST_KEY_INDEX: undefined,
  IS_READ_ONLY: true,
  parseCommand(parser: CommandParser, message?: RedisArgument) {
    parser.push('PING');
    if (message) {
      parser.push(message);
    }
  },
  transformArguments(message?: RedisArgument) { return [] },
  transformReply: undefined as unknown as () => SimpleStringReply | BlobStringReply
} as const satisfies Command;
