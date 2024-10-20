import { CommandParser } from '@redis/client/lib/client/parser';
import { RedisArgument, ArrayReply, NumberReply, NullReply, Command, } from '@redis/client/lib/RESP/types';

export default {
  IS_READ_ONLY: false,
  parseCommand(parser: CommandParser, key: RedisArgument, path: RedisArgument) {
    parser.push('JSON.TOGGLE');
    parser.pushKey(key);
    parser.push(path);
  },
  transformReply: undefined as unknown as () => NumberReply | NullReply | ArrayReply<NumberReply | NullReply>
} as const satisfies Command;
