import { CommandParser } from '@redis/client/dist/lib/client/parser';
import { RedisArgument, Command } from '@redis/client/dist/lib/RESP/types';
import { RedisVariadicArgument } from '@redis/client/dist/lib/commands/generic-transformers';
import { transformRedisJsonNullReply } from './helpers';

export interface JsonGetOptions {
  path?: RedisVariadicArgument;
}

export default {
  IS_READ_ONLY: false,
  parseCommand(
    parser: CommandParser,
    key: RedisArgument,
    options?: JsonGetOptions
  ) {
    parser.push('JSON.GET');
    parser.pushKey(key);
    if (options?.path !== undefined) {
      parser.pushVariadic(options.path);
    }
  },
  transformReply: transformRedisJsonNullReply
} as const satisfies Command;