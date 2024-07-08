import { RedisArgument, ArrayReply, BlobStringReply, Command } from '../RESP/types';
import { CommandParser } from '../client/parser';

export default {
  FIRST_KEY_INDEX: undefined,
  IS_READ_ONLY: true,
  parseCommand(parser: CommandParser, args: Array<RedisArgument>) {
    parser.pushVariadic(['COMMAND', 'GETKEYS', ...args]);
  },
  transformArguments(args: Array<RedisArgument>) { return [] },
  transformReply: undefined as unknown as () => ArrayReply<BlobStringReply>
} as const satisfies Command;
