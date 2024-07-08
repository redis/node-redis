import { RedisArgument, ArrayReply, NumberReply, NullReply, Command } from '@redis/client/dist/lib/RESP/types';
import { CommandParser } from '@redis/client/dist/lib/client/parser';

export interface JsonStrLenOptions {
  path?: RedisArgument;
}

export default {
  FIRST_KEY_INDEX: 1,
  IS_READ_ONLY: true,
  parseCommand(parser: CommandParser, key: RedisArgument, options?: JsonStrLenOptions) {
    parser.push('JSON.STRLEN');
    parser.pushKey(key);

    if (options?.path) {
      parser.push(options.path);
    }
  },
  transformArguments(key: RedisArgument, options?: JsonStrLenOptions) { return [] },
  transformReply: undefined as unknown as () => NumberReply | ArrayReply<NumberReply | NullReply>
} as const satisfies Command;
