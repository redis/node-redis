import { CommandParser } from '../client/parser';
import { RedisArgument, ArrayReply, BlobStringReply, Command } from '../RESP/types';

export default {
  IS_READ_ONLY: true,
  parseCommand(
    parser: CommandParser,
    key: RedisArgument,
    start: RedisArgument,
    end: RedisArgument,
    count?: number
  ) {
    parser.push('VRANGE');
    parser.pushKey(key);
    parser.push(start, end);

    if (count !== undefined) {
      parser.push(count.toString());
    }
  },
  transformReply: undefined as unknown as () => ArrayReply<BlobStringReply>
} as const satisfies Command;

