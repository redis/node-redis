import { RedisArgument, NumberReply, ArrayReply, NullReply, Command } from '@redis/client/dist/lib/RESP/types';
import { RedisJSON, transformRedisJsonArgument } from '.';
import { CommandParser } from '@redis/client/dist/lib/client/parser';

export interface JsonArrIndexOptions {
  range?: {
    start: number;
    stop?: number;
  };
}

export default {
  FIRST_KEY_INDEX: 1,
  IS_READ_ONLY: true,
  parseCommand(
    parser: CommandParser,
    key: RedisArgument,
    path: RedisArgument,
    json: RedisJSON,
    options?: JsonArrIndexOptions
  ) {
    parser.push('JSON.ARRINDEX');
    parser.pushKey(key);
    parser.pushVariadic([path, transformRedisJsonArgument(json)]);

    if (options?.range) {
      parser.push(options.range.start.toString());

      if (options.range.stop !== undefined) {
        parser.push(options.range.stop.toString());
      }
    }
  },
  transformArguments(
    key: RedisArgument,
    path: RedisArgument,
    json: RedisJSON,
    options?: JsonArrIndexOptions
  ) { return [] },
  transformReply: undefined as unknown as () => NumberReply | ArrayReply<NumberReply | NullReply>
} as const satisfies Command;
