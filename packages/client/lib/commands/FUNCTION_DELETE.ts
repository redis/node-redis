import { CommandParser } from '../client/parser';
import { RedisArgument, SimpleStringReply, Command } from '../RESP/types';

export default {
  NOT_KEYED_COMMAND: true,
  IS_READ_ONLY: false,
  /**
   * Deletes a library and all its functions
   * @param parser - The Redis command parser
   * @param library - Name of the library to delete
   */
  parseCommand(parser: CommandParser, library: RedisArgument) {
    parser.push('FUNCTION', 'DELETE', library);
  },
  transformReply: undefined as unknown as () => SimpleStringReply
} as const satisfies Command;
