import { CommandParser } from '@redis/client/lib/client/parser';
import { RedisArgument, NumberReply, Command } from '@redis/client/lib/RESP/types';

export interface JsonClearOptions {
  path?: RedisArgument;
}

export default {
  IS_READ_ONLY: false,
  parseCommand(parser: CommandParser, key: RedisArgument, options?: JsonClearOptions) {
    parser.push('JSON.CLEAR');
    parser.pushKey(key);

    if (options?.path !== undefined) {
      parser.push(options.path);
    }
  },
  transformReply: undefined as unknown as () => NumberReply
} as const satisfies Command;
