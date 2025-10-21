import { CommandParser } from '../client/parser';
import { ArrayReply, BlobStringReply, NumberReply, UnwrapReply, Command } from '../RESP/types';
import { RedisVariadicArgument } from './generic-transformers';

export default {
  NOT_KEYED_COMMAND: true,
  IS_READ_ONLY: true,
  /**
   * Constructs the PUBSUB NUMSUB command
   *
   * @param parser - The command parser
   * @param channels - Optional channel names to get subscription count for
   * @see https://redis.io/commands/pubsub-numsub/
   */
  parseCommand(parser: CommandParser, channels?: RedisVariadicArgument) {
    parser.push('PUBSUB', 'NUMSUB');

    if (channels) {
      parser.pushVariadic(channels);
    }
  },
  /**
   * Transforms the PUBSUB NUMSUB reply into a record of channel name to subscriber count
   *
   * @param rawReply - The raw reply from Redis
   * @returns Record mapping channel names to their subscriber counts
   */
  transformReply(rawReply: UnwrapReply<ArrayReply<BlobStringReply | NumberReply>>) {
    const reply = Object.create(null);
    let i = 0;
    while (i < rawReply.length) {
      reply[rawReply[i++].toString()] = Number(rawReply[i++]);
    }

    return reply as Record<string, NumberReply>;
  }
} as const satisfies Command;
