import { CommandParser } from '../client/parser';
import { RedisArgument, BlobStringReply, Command, ArrayReply } from '../RESP/types';

export default {
  parseCommand(parser: CommandParser, key: RedisArgument) {
    parser.push('BLESS');
    parser.push('GET');
    parser.pushKey(key);
  },
  transformReply: undefined as unknown as () => ArrayReply<BlobStringReply>
} as const satisfies Command;
