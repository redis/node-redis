import { CommandParser } from '@redis/client/lib/client/parser';
import { RedisArgument, ArrayReply, NumberReply, NullReply, Command } from '@redis/client/lib/RESP/types';

export default {
  IS_READ_ONLY: false,
  parseCommand(parser: CommandParser, key: RedisArgument, path: RedisArgument, start: number, stop: number) {
    parser.push('JSON.ARRTRIM');
    parser.pushKey(key);
    parser.push(path, start.toString(), stop.toString());
  },
  transformReply: undefined as unknown as () => NumberReply | ArrayReply<NumberReply | NullReply>
} as const satisfies Command;
