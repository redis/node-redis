import { RedisArgument, BlobStringReply, NullReply, Command } from '../RESP/types';
import { CommandParser } from '../client/parser';

export default {
  FIRST_KEY_INDEX: 1,
  IS_READ_ONLY: true,
  parseCommand(parser: CommandParser, keys: Array<RedisArgument>) {
    parser.setCachable();
    parser.push('MGET');
    parser.pushKeys(keys);
  },
  transformArguments(keys: Array<RedisArgument>) { return [] },
  transformReply: undefined as unknown as () => Array<BlobStringReply | NullReply>
} as const satisfies Command;
