import { CommandParser } from '../client/parser';
import { RedisArgument, ArrayReply, BlobStringReply, Command } from '../RESP/types';

export default {
  IS_READ_ONLY: true,
  parseCommand(parser: CommandParser, key: RedisArgument, count: number) {
    parser.push('HRANDFIELD');
    parser.pushKey(key);
    parser.push(count.toString());
  },
  transformReply: undefined as unknown as () => ArrayReply<BlobStringReply>
} as const satisfies Command;
