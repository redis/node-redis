import { CommandParser } from '../client/parser';
import { NumberReply, Command } from '../RESP/types';

export default {
  NOT_KEYED_COMMAND: true,
  IS_READ_ONLY: true,
  /**
   * Returns the total number of commands available in the Redis server
   * @param parser - The Redis command parser
   */
  parseCommand(parser: CommandParser) {
    parser.push('COMMAND', 'COUNT');
  },
  transformReply: undefined as unknown as () => NumberReply
} as const satisfies Command;
