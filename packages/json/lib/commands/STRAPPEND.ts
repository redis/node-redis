import { CommandParser } from '@redis/client/lib/client/parser';
import { RedisArgument, Command, NullReply, NumberReply, ArrayReply } from '@redis/client/lib/RESP/types';
import { transformRedisJsonArgument } from '.';

export interface JsonStrAppendOptions {
  path?: RedisArgument;
}

export default {
  IS_READ_ONLY: false,
  parseCommand(parser: CommandParser, key: RedisArgument, append: string, options?: JsonStrAppendOptions) {
    parser.push('JSON.STRAPPEND');
    parser.pushKey(key);

    if (options?.path !== undefined) {
      parser.push(options.path);
    }

    parser.push(transformRedisJsonArgument(append));
  },
  transformReply: undefined as unknown as () => NumberReply | ArrayReply<NullReply | NumberReply>
} as const satisfies Command;
