import { RedisArgument, ArrayReply, NumberReply, NullReply, Command } from '@redis/client/dist/lib/RESP/types';
import { CommandParser } from '@redis/client/dist/lib/client/parser';

export interface JsonArrLenOptions {
  path?: RedisArgument;
}

export default {
  FIRST_KEY_INDEX: 1,
  IS_READ_ONLY: true,
  parseCommand(parser: CommandParser, key: RedisArgument, options?: JsonArrLenOptions) {
    parser.push('JSON.ARRLEN');
    parser.pushKey(key);
    if (options?.path !== undefined) {
      parser.push(options.path);
    }
  },
  transformArguments(key: RedisArgument, options?: JsonArrLenOptions) { return [] },
  transformReply: undefined as unknown as () => NumberReply | ArrayReply<NumberReply | NullReply>
} as const satisfies Command;
