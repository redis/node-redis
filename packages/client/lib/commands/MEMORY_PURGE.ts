import { CommandParser } from '../client/parser';
import { SimpleStringReply, Command } from '../RESP/types';

export default {
  NOT_KEYED_COMMAND: true,
  IS_READ_ONLY: false,
  /**
   * Constructs the MEMORY PURGE command
   * 
   * @param parser - The command parser
   * @see https://redis.io/commands/memory-purge/
   */
  parseCommand(parser: CommandParser) {
    parser.push('MEMORY', 'PURGE');
  },
  transformReply: undefined as unknown as () => SimpleStringReply<'OK'>
} as const satisfies Command;

