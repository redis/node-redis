import { CommandParser } from '@redis/client/lib/client/parser';
import { RedisArgument, NumberReply, ArrayReply, NullReply, Command } from '@redis/client/lib/RESP/types';

export interface JsonObjLenOptions {
  path?: RedisArgument;
}

export default {
  IS_READ_ONLY: true,
  parseCommand(parser: CommandParser, key: RedisArgument, options?: JsonObjLenOptions) {
    parser.push('JSON.OBJLEN');
    parser.pushKey(key);
    if (options?.path !== undefined) {
      parser.push(options.path);
    }
  },
  transformReply: undefined as unknown as () => NumberReply | ArrayReply<NumberReply | NullReply>
} as const satisfies Command;
