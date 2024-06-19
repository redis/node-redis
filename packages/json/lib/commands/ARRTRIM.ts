import { RedisArgument, ArrayReply, NumberReply, NullReply, Command } from '@redis/client/dist/lib/RESP/types';
import { CommandParser } from '@redis/client/dist/lib/client/parser';

export default {
  FIRST_KEY_INDEX: 1,
  IS_READ_ONLY: false,
  parseCommand(parser: CommandParser, key: RedisArgument, path: RedisArgument, start: number, stop: number) {
    parser.push('JSON.ARRTRIM');
    parser.pushKey(key);
    parser.pushVariadic([path, start.toString(), stop.toString()]);
  },
  transformArguments(key: RedisArgument, path: RedisArgument, start: number, stop: number) { return [] },
  transformReply: undefined as unknown as () => NumberReply | ArrayReply<NumberReply | NullReply>
} as const satisfies Command;
