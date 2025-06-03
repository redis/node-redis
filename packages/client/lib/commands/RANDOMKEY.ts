import { CommandParser } from '../client/parser';
import { NumberReply, Command } from '../RESP/types';

export default {
  NOT_KEYED_COMMAND: true,
  IS_READ_ONLY: true,
  /**
   * Constructs the RANDOMKEY command
   * 
   * @param parser - The command parser
   * @see https://redis.io/commands/randomkey/
   */
  parseCommand(parser: CommandParser) {
    parser.push('RANDOMKEY');
  },
  transformReply: undefined as unknown as () => NumberReply
} as const satisfies Command;
