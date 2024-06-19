import { RedisArgument, NumberReply, Command } from '@redis/client/dist/lib/RESP/types';
import { CommandParser } from '@redis/client/dist/lib/client/parser';

export interface JsonDelOptions {
  path?: RedisArgument
}

export default {
  FIRST_KEY_INDEX: 1,
  IS_READ_ONLY: false,
  parseCommand(parser: CommandParser, key: RedisArgument, options?: JsonDelOptions) {
    parser.push('JSON.DEL');
    parser.pushKey(key);

    if (options?.path !== undefined) {
      parser.push(options.path);
    }
  },
  transformArguments(key: RedisArgument, options?: JsonDelOptions) { return [] },
  transformReply: undefined as unknown as () => NumberReply
} as const satisfies Command;
