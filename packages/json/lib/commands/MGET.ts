import { CommandParser } from '@redis/client/dist/lib/client/parser';
import { RedisArgument, UnwrapReply, ArrayReply, NullReply, BlobStringReply, Command } from '@redis/client/dist/lib/RESP/types';
import { transformRedisJsonNullReply } from './helpers';

export default {
  IS_READ_ONLY: true,
  parseCommand(parser: CommandParser, keys: Array<RedisArgument>, path: RedisArgument) {
    parser.push('JSON.MGET');
    parser.pushKeys(keys);
    parser.push(path);
  },
  transformReply(reply: UnwrapReply<ArrayReply<NullReply | BlobStringReply>>) {
    return reply.map(json => transformRedisJsonNullReply(json))
  }
} as const satisfies Command;
