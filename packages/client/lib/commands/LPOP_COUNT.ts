import { CommandParser } from '../client/parser';
import { RedisArgument, NullReply, ArrayReply, BlobStringReply, Command } from '../RESP/types';
import LPOP from './LPOP';

export default {
  IS_READ_ONLY: false,
  parseCommand(parser: CommandParser, key: RedisArgument, count: number) {
    LPOP.parseCommand(parser, key);
    parser.push(count.toString())
  },
  transformReply: undefined as unknown as () => NullReply | ArrayReply<BlobStringReply>
} as const satisfies Command;
