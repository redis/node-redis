import { CommandParser } from '../client/parser';
import { OTelMetrics } from '../opentelemetry';
import { RedisArgument, NumberReply, Command } from '../RESP/types';

export default {
  NOT_KEYED_COMMAND: true,
  IS_READ_ONLY: true,
  IS_FORWARD_COMMAND: true,
  /**
   * Constructs the PUBLISH command
   * 
   * @param parser - The command parser
   * @param channel - The channel to publish to
   * @param message - The message to publish
   * @see https://redis.io/commands/publish/
   */
  parseCommand(parser: CommandParser, channel: RedisArgument, message: RedisArgument) {
    parser.push('PUBLISH', channel, message);
  },
  transformReply: undefined as unknown as () => NumberReply,
  onSuccess: (args, _reply, clientAttrs) => {
    OTelMetrics.instance.pubSubMetrics.recordPubSubMessage(
      "out",
      args[1],
      false,
      clientAttrs,
    );
  },
} as const satisfies Command;
