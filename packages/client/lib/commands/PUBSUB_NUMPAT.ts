import { CommandParser } from '../client/parser';
import { NumberReply, Command } from '../RESP/types';

export default {
  NOT_KEYED_COMMAND: true,
  IS_READ_ONLY: true,
  /**
   * Constructs the PUBSUB NUMPAT command
   * 
   * @param parser - The command parser
   * @see https://redis.io/commands/pubsub-numpat/
   */
  parseCommand(parser: CommandParser) {
    parser.push('PUBSUB', 'NUMPAT');
  },
  transformReply: undefined as unknown as () => NumberReply
} as const satisfies Command;
