import { CommandParser } from '../client/parser';
import { RedisArgument, ArrayReply, BlobStringReply, NullReply, Command } from '../RESP/types';

export default {
  parseCommand(parser: CommandParser, key: RedisArgument, element: RedisArgument) {
    parser.push('VLINKS');
    parser.pushKey(key);
    parser.push(element);
  },
  transformReply: undefined as unknown as () => ArrayReply<ArrayReply<BlobStringReply>> | NullReply
} as const satisfies Command;
