import { RedisArgument, ArrayReply, TuplesReply, BlobStringReply, NullReply, UnwrapReply, Command } from '../RESP/types';
import { CommandParser } from '../client/parser';
import { RedisVariadicArgument } from './generic-transformers';

export default {
  FIRST_KEY_INDEX: 1,
  IS_READ_ONLY: true,
  parseCommand(parser: CommandParser, key: RedisArgument, member: RedisVariadicArgument) {
    parser.setCachable();
    parser.push('GEOPOS');
    parser.pushKey(key);
    parser.pushVariadic(member);
  },
  transformArguments(key: RedisArgument, member: RedisVariadicArgument) { return [] },
  transformReply(reply: UnwrapReply<ArrayReply<TuplesReply<[BlobStringReply, BlobStringReply]> | NullReply>>) {
    return reply.map(item => {
      const unwrapped = item as unknown as UnwrapReply<typeof item>;
      return unwrapped === null ? null : {
        longitude: unwrapped[0],
        latitude: unwrapped[1]
      };
    });
  }
} as const satisfies Command;
