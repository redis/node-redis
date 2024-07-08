import { SimpleStringReply, Command, RedisArgument } from '@redis/client/dist/lib/RESP/types';
import { RedisJSON, transformRedisJsonArgument } from '.';
import { CommandParser } from '@redis/client/dist/lib/client/parser';

export default {
  FIRST_KEY_INDEX: 1,
  IS_READ_ONLY: false,
  parseCommand(parser: CommandParser, key: RedisArgument, path: RedisArgument, value: RedisJSON) {
    parser.push('JSON.MERGE');
    parser.pushKey(key);
    parser.pushVariadic([path, transformRedisJsonArgument(value)]);
  },
  transformArguments(key: RedisArgument, path: RedisArgument, value: RedisJSON) { return [] },
  transformReply: undefined as unknown as () => SimpleStringReply<'OK'>
} as const satisfies Command;
