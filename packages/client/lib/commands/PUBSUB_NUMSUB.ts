import { ArrayReply, BlobStringReply, NumberReply, UnwrapReply, Command } from '../RESP/types';
import { CommandParser } from '../client/parser';
import { RedisVariadicArgument } from './generic-transformers';

export default {
  FIRST_KEY_INDEX: undefined,
  IS_READ_ONLY: true,
  parseCommand(parser: CommandParser, channels?: RedisVariadicArgument) {
    parser.pushVariadic(['PUBSUB', 'NUMSUB']);

    if (channels) {
      parser.pushVariadic(channels);
    }
  },
  transformArguments(channels?: RedisVariadicArgument) { return [] },
  transformReply(rawReply: UnwrapReply<ArrayReply<BlobStringReply | NumberReply>>) {
    const reply = Object.create(null);
    let i = 0;
    while (i < rawReply.length) {
      reply[rawReply[i++].toString()] = rawReply[i++].toString();
    }

    return reply as Record<string, NumberReply>;
  }
} as const satisfies Command;
