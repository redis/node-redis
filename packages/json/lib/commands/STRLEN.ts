import { CommandParser } from '@redis/client/dist/lib/client/parser';
import { RedisArgument, ArrayReply, NumberReply, NullReply, Command } from '@redis/client/dist/lib/RESP/types';

export interface JsonStrLenOptions {
  path?: RedisArgument;
}

export default {
  IS_READ_ONLY: true,
  parseCommand(parser: CommandParser, key: RedisArgument, options?: JsonStrLenOptions) {
    parser.push('JSON.STRLEN');
    parser.pushKey(key);

    if (options?.path) {
      parser.push(options.path);
    }
  },
  transformReply: undefined as unknown as () => NumberReply | ArrayReply<NumberReply | NullReply>
} as const satisfies Command;
