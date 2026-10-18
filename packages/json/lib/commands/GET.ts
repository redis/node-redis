import { CommandParser } from '@redis/client/dist/lib/client/parser';
import { RedisArgument, Command } from '@redis/client/dist/lib/RESP/types';
import { RedisVariadicArgument, transformRedisJsonNullReply, JsonReviver } from '@redis/client/dist/lib/commands/generic-transformers';

export interface JsonGetOptions {
  path?: RedisVariadicArgument;
  reviver?: JsonReviver;
  responseMap?: Record<string, string>;
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
   parser.preserve = options?.responseMap 
      ? { reviver: options?.reviver, responseMap: options?.responseMap }
      : options?.reviver;
  },
  transformReply: transformRedisJsonNullReply
} as const satisfies Command;
