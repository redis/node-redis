import { CommandParser } from '@redis/client/lib/client/parser';
import { RedisArgument, Command } from '@redis/client/lib/RESP/types';
import { RedisVariadicArgument } from '@redis/client/lib/commands/generic-transformers';
import { transformRedisJsonNullReply } from '.';

export interface JsonGetOptions {
  path?: RedisVariadicArgument;
}

export default {
  IS_READ_ONLY: false,
  parseCommand(parser: CommandParser, key: RedisArgument, options?: JsonGetOptions) {
    parser.push('JSON.GET');
    parser.pushKey(key);
    if (options?.path !== undefined) {
      parser.pushVariadic(options.path)
    }
  },
  transformReply: transformRedisJsonNullReply
} as const satisfies Command;
