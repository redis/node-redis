import { CommandParser } from '../client/parser';
import { ArrayReply, BlobStringReply, NumberReply, UnwrapReply, Command } from '../RESP/types';
import { RedisVariadicArgument } from './generic-transformers';

export default {
  IS_READ_ONLY: true,
  parseCommand(parser: CommandParser, channels?: RedisVariadicArgument) {
    parser.push('PUBSUB', 'SHARDNUMSUB');

    if (channels) {
      parser.pushVariadic(channels);
    }
  },
  transformReply(reply: UnwrapReply<ArrayReply<BlobStringReply | NumberReply>>) {
    const transformedReply: Record<string, NumberReply> = Object.create(null);

    for (let i = 0; i < reply.length; i += 2) {
      transformedReply[(reply[i] as BlobStringReply).toString()] = reply[i + 1] as NumberReply;
    }
  
    return transformedReply;
  }
} as const satisfies Command;

