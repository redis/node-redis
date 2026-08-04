import { CommandParser } from '../client/parser';
import { RedisArgument, BlobStringReply, NullReply, Command } from '../RESP/types';

export default {
  parseCommand(parser: CommandParser, keys: Array<RedisArgument>) {
    parser.push('MGET');
    parser.pushKeys(keys);
  },
  transformReply: undefined as unknown as () => Array<BlobStringReply | NullReply>
} as const satisfies Command;
