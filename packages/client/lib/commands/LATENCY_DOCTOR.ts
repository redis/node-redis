import { CommandParser } from '../client/parser';
import { BlobStringReply, Command } from '../RESP/types';

export default {
  NOT_KEYED_COMMAND: true,
  IS_READ_ONLY: true,
  /**
   * Constructs the LATENCY DOCTOR command
   * 
   * @param parser - The command parser
   * @see https://redis.io/commands/latency-doctor/
   */
  parseCommand(parser: CommandParser) {
    parser.push('LATENCY', 'DOCTOR');
  },
  transformReply: undefined as unknown as () => BlobStringReply
} as const satisfies Command;
