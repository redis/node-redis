import { CommandParser } from '../client/parser';
import { RedisArgument, SimpleStringReply, BlobStringReply, Command } from '../RESP/types';

export default {
  NOT_KEYED_COMMAND: true,
  IS_READ_ONLY: true,
  parseCommand(parser: CommandParser, message?: RedisArgument) {
    parser.push('PING');
    if (message) {
      parser.push(message);
    }
  },
  transformReply: undefined as unknown as () => SimpleStringReply | BlobStringReply
} as const satisfies Command;
