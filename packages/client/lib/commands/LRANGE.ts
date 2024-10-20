import { CommandParser } from '../client/parser';
import { RedisArgument, ArrayReply, BlobStringReply, Command } from '../RESP/types';

export default {
  IS_READ_ONLY: true,
  parseCommand(parser: CommandParser, key: RedisArgument, start: number, stop: number) {
    parser.setCachable();
    parser.push('LRANGE');
    parser.pushKey(key);
    parser.push(start.toString(), stop.toString())
  },
  transformReply: undefined as unknown as () => ArrayReply<BlobStringReply>
} as const satisfies Command;
