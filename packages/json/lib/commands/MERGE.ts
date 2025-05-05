import { CommandParser } from '@redis/client/dist/lib/client/parser';
import { SimpleStringReply, Command, RedisArgument } from '@redis/client/dist/lib/RESP/types';
import { RedisJSON, transformRedisJsonArgument } from './helpers';

export default {
  IS_READ_ONLY: false,
  parseCommand(parser: CommandParser, key: RedisArgument, path: RedisArgument, value: RedisJSON) {
    parser.push('JSON.MERGE');
    parser.pushKey(key);
    parser.push(path, transformRedisJsonArgument(value));
  },
  transformReply: undefined as unknown as () => SimpleStringReply<'OK'>
} as const satisfies Command;
