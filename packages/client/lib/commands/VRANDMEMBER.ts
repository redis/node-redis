import { CommandParser } from '../client/parser';
import { RedisArgument, BlobStringReply, ArrayReply, Command, NullReply } from '../RESP/types';

export default {
  IS_READ_ONLY: true,
  parseCommand(parser: CommandParser, key: RedisArgument, count?: number) {
    parser.push('VRANDMEMBER');
    parser.pushKey(key);
    
    if (count !== undefined) {
      parser.push(count.toString());
    }
  },
  transformReply: undefined as unknown as () => BlobStringReply | ArrayReply<BlobStringReply> | NullReply
} as const satisfies Command;
