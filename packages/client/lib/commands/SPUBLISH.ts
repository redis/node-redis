import { CommandParser } from '../client/parser';
import { RedisArgument, NumberReply, Command } from '../RESP/types';

export default {
  IS_READ_ONLY: true,
  /**
   * Constructs the SPUBLISH command to post a message to a Sharded Pub/Sub channel
   *
   * @param parser - The command parser
   * @param channel - The channel to publish to
   * @param message - The message to publish
   * @see https://redis.io/commands/spublish/
   */
  parseCommand(parser: CommandParser, channel: RedisArgument, message: RedisArgument) {
    parser.push('SPUBLISH');
    parser.pushKey(channel);
    parser.push(message);
  },
  transformReply: undefined as unknown as () => NumberReply
} as const satisfies Command;
