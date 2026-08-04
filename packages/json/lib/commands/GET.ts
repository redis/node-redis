import { CommandParser } from '@redis/client/dist/lib/client/parser';
import { RedisArgument, Command } from '@redis/client/dist/lib/RESP/types';
import { RedisVariadicArgument, transformRedisJsonNullReply, JsonReviver } from '@redis/client/dist/lib/commands/generic-transformers';

export interface JsonGetOptions {
  path?: RedisVariadicArgument;
  reviver?: JsonReviver
}

export default {
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
    parser.preserve = options?.reviver;
  },
  transformReply: transformRedisJsonNullReply
} as const satisfies Command;