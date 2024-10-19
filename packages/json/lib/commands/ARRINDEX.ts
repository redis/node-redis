import { CommandParser } from '@redis/client/lib/client/parser';
import { RedisArgument, NumberReply, ArrayReply, NullReply, Command } from '@redis/client/lib/RESP/types';
import { RedisJSON, transformRedisJsonArgument } from '.';

export interface JsonArrIndexOptions {
  range?: {
    start: number;
    stop?: number;
  };
}

export default {
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
    parser.push(path, transformRedisJsonArgument(json));

    if (options?.range) {
      parser.push(options.range.start.toString());

      if (options.range.stop !== undefined) {
        parser.push(options.range.stop.toString());
      }
    }
  },
  transformReply: undefined as unknown as () => NumberReply | ArrayReply<NumberReply | NullReply>
} as const satisfies Command;
