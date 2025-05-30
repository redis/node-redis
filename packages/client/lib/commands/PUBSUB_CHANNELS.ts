import { CommandParser } from '../client/parser';
import { RedisArgument, ArrayReply, BlobStringReply, Command } from '../RESP/types';

export default {
  NOT_KEYED_COMMAND: true,
  IS_READ_ONLY: true,
  /**
   * Constructs the PUBSUB CHANNELS command
   * 
   * @param parser - The command parser
   * @param pattern - Optional pattern to filter channels
   * @see https://redis.io/commands/pubsub-channels/
   */
  parseCommand(parser: CommandParser, pattern?: RedisArgument) {
    parser.push('PUBSUB', 'CHANNELS');

    if (pattern) {
      parser.push(pattern);
    }
  },
  transformReply: undefined as unknown as () => ArrayReply<BlobStringReply>
} as const satisfies Command;

