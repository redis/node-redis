import { CommandParser } from '../client/parser';
import { NumberReply, Command } from '../RESP/types';

export default {
  NOT_KEYED_COMMAND: true,
  IS_READ_ONLY: true,
  /**
   * Constructs the LASTSAVE command
   * 
   * @param parser - The command parser
   * @see https://redis.io/commands/lastsave/
   */
  parseCommand(parser: CommandParser) {
    parser.push('LASTSAVE');
  },
  transformReply: undefined as unknown as () => NumberReply
} as const satisfies Command;
