import { CommandParser } from '../client/parser';
import { RedisArgument, ArrayReply, BlobStringReply, Command } from '../RESP/types';

export default {
  IS_READ_ONLY: true,
  parseCommand(parser: CommandParser, key: RedisArgument, element: RedisArgument) {
    parser.push('VLINKS');
    parser.pushKey(key);
    parser.push(element);
  },
  transformReply: undefined as unknown as () => ArrayReply<ArrayReply<BlobStringReply>>
} as const satisfies Command;
