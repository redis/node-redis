import { RedisArgument, ArrayReply, BlobStringReply, Command } from '../RESP/types';
import { CommandParser } from '../client/parser';

export default {
  FIRST_KEY_INDEX: 1,
  IS_READ_ONLY: true,
  parseCommand(parser: CommandParser, key: RedisArgument, start: number, stop: number) {
    parser.setCachable();
    parser.push('LRANGE');
    parser.pushKey(key);
    parser.pushVariadic([start.toString(), stop.toString()])
  },
  transformArguments(key: RedisArgument, start: number, stop: number) { return [] },
  transformReply: undefined as unknown as () => ArrayReply<BlobStringReply>
} as const satisfies Command;
