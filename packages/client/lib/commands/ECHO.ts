import { CommandParser } from '../client/parser';
import { RedisArgument, BlobStringReply, Command } from '../RESP/types';

export default {
  NOT_KEYED_COMMAND: true,
  IS_READ_ONLY: true,
  /**
   * Returns the given string
   * @param parser - The Redis command parser
   * @param message - Message to echo back
   */
  parseCommand(parser: CommandParser, message: RedisArgument) {
    parser.push('ECHO', message);
  },
  transformReply: undefined as unknown as () => BlobStringReply
} as const satisfies Command;
