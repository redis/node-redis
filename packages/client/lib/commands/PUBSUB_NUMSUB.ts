import { CommandParser } from '../client/parser';
import { ArrayReply, BlobStringReply, NumberReply, UnwrapReply, Command } from '../RESP/types';
import { RedisVariadicArgument } from './generic-transformers';

export default {
  NOT_KEYED_COMMAND: true,
  IS_READ_ONLY: true,
  parseCommand(parser: CommandParser, channels?: RedisVariadicArgument) {
    parser.push('PUBSUB', 'NUMSUB');

    if (channels) {
      parser.pushVariadic(channels);
    }
  },
  transformReply(rawReply: UnwrapReply<ArrayReply<BlobStringReply | NumberReply>>) {
    const reply = Object.create(null);
    let i = 0;
    while (i < rawReply.length) {
      reply[rawReply[i++].toString()] = rawReply[i++].toString();
    }

    return reply as Record<string, NumberReply>;
  }
} as const satisfies Command;
