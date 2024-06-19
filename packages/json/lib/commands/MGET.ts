import { RedisArgument, UnwrapReply, ArrayReply, NullReply, BlobStringReply, Command } from '@redis/client/dist/lib/RESP/types';
import { transformRedisJsonNullReply } from '.';
import { CommandParser } from '@redis/client/dist/lib/client/parser';

export default {
  FIRST_KEY_INDEX: 1,
  IS_READ_ONLY: true,
  parseCommand(parser: CommandParser, keys: Array<RedisArgument>, path: RedisArgument) {
    parser.push('JSON.MGET');
    parser.pushKeys(keys);
    parser.push(path);
  },
  transformArguments(keys: Array<RedisArgument>, path: RedisArgument) { return [] },
  transformReply(reply: UnwrapReply<ArrayReply<NullReply | BlobStringReply>>) {
    return reply.map(json => transformRedisJsonNullReply(json))
  }
} as const satisfies Command;
