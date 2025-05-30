import { CommandParser } from '../client/parser';
import { ArrayReply, BlobStringReply, NumberReply, UnwrapReply, Command } from '../RESP/types';
import { RedisVariadicArgument } from './generic-transformers';

export default {
  IS_READ_ONLY: true,
  /**
   * Constructs the PUBSUB SHARDNUMSUB command
   * 
   * @param parser - The command parser
   * @param channels - Optional shard channel names to get subscription count for
   * @see https://redis.io/commands/pubsub-shardnumsub/
   */
  parseCommand(parser: CommandParser, channels?: RedisVariadicArgument) {
    parser.push('PUBSUB', 'SHARDNUMSUB');

    if (channels) {
      parser.pushVariadic(channels);
    }
  },
  /**
   * Transforms the PUBSUB SHARDNUMSUB reply into a record of shard channel name to subscriber count
   * 
   * @param reply - The raw reply from Redis
   * @returns Record mapping shard channel names to their subscriber counts
   */
  transformReply(reply: UnwrapReply<ArrayReply<BlobStringReply | NumberReply>>) {
    const transformedReply: Record<string, NumberReply> = Object.create(null);

    for (let i = 0; i < reply.length; i += 2) {
      transformedReply[(reply[i] as BlobStringReply).toString()] = reply[i + 1] as NumberReply;
    }
  
    return transformedReply;
  }
} as const satisfies Command;

