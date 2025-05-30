import { CommandParser } from '../client/parser';
import { BlobStringReply, Command } from '../RESP/types';

export default {
  NOT_KEYED_COMMAND: true,
  IS_READ_ONLY: true,
  /**
   * Constructs the TIME command to return the server's current time
   *
   * @param parser - The command parser
   * @returns Array containing the Unix timestamp in seconds and microseconds
   * @see https://redis.io/commands/time/
   */
  parseCommand(parser: CommandParser) {
    parser.push('TIME');
  },
  transformReply: undefined as unknown as () => [
    unixTimestamp: BlobStringReply<`${number}`>,
    microseconds: BlobStringReply<`${number}`>
  ]
} as const satisfies Command;
