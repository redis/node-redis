import { CommandParser } from '../client/parser';
import { RedisArgument, SimpleStringReply, Command } from '../RESP/types';

export default {
  NOT_KEYED_COMMAND: true,
  IS_READ_ONLY: true,
  /**
   * Assigns a name to the current connection
   * @param parser - The Redis command parser
   * @param name - The name to assign to the connection
   */
  parseCommand(parser: CommandParser, name: RedisArgument) {
    parser.push('CLIENT', 'SETNAME', name);
  },
  transformReply: undefined as unknown as () => SimpleStringReply<'OK'>
} as const satisfies Command;
