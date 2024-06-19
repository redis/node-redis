import { RedisArgument, NumberReply, Command } from '@redis/client/dist/lib/RESP/types';
import { CommandParser } from '@redis/client/dist/lib/client/parser';

export interface JsonClearOptions {
  path?: RedisArgument;
}

export default {
  FIRST_KEY_INDEX: 1,
  IS_READ_ONLY: false,
  parseCommand(parser: CommandParser, key: RedisArgument, options?: JsonClearOptions) {
    parser.push('JSON.CLEAR');
    parser.pushKey(key);

    if (options?.path !== undefined) {
      parser.push(options.path);
    }
  },
  transformArguments(key: RedisArgument, options?: JsonClearOptions) { return [] },
  transformReply: undefined as unknown as () => NumberReply
} as const satisfies Command;
