import { RedisArgument, ArrayReply, NumberReply, NullReply, Command, } from '@redis/client/dist/lib/RESP/types';
import { CommandParser } from '@redis/client/dist/lib/client/parser';

export default {
  FIRST_KEY_INDEX: 1,
  IS_READ_ONLY: false,
  parseCommand(parser: CommandParser, key: RedisArgument, path: RedisArgument) {
    parser.push('JSON.TOGGLE');
    parser.pushKey(key);
    parser.push(path);
  },
  transformArguments(key: RedisArgument, path: RedisArgument) { return [] },
  transformReply: undefined as unknown as () => NumberReply | NullReply | ArrayReply<NumberReply | NullReply>
} as const satisfies Command;
