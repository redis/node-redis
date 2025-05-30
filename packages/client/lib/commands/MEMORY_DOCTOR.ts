import { CommandParser } from '../client/parser';
import { BlobStringReply, Command } from '../RESP/types';

export default {
  NOT_KEYED_COMMAND: true,
  IS_READ_ONLY: true,
  /**
   * Constructs the MEMORY DOCTOR command
   * 
   * @param parser - The command parser
   * @see https://redis.io/commands/memory-doctor/
   */
  parseCommand(parser: CommandParser) {
    parser.push('MEMORY', 'DOCTOR');
  },
  transformReply: undefined as unknown as () => BlobStringReply
} as const satisfies Command;
