import { CommandParser } from '../client/parser';
import { RedisArgument, VerbatimStringReply, Command } from '../RESP/types';

export default {
  NOT_KEYED_COMMAND: true,
  IS_READ_ONLY: true,
  /**
   * Constructs the INFO command
   * 
   * @param parser - The command parser
   * @param section - Optional specific section of information to retrieve
   * @see https://redis.io/commands/info/
   */
  parseCommand(parser: CommandParser, section?: RedisArgument) {
    parser.push('INFO');

    if (section) {
      parser.push(section);
    }
  },
  transformReply: undefined as unknown as () => VerbatimStringReply
} as const satisfies Command;
