import { RedisArgument, BlobStringReply, Command } from '../RESP/types';
import { CommandParser } from '../client/parser';

export default {
  FIRST_KEY_INDEX: 1,
  IS_READ_ONLY: true,
  parseCommand(
    parser: CommandParser,
    key1: RedisArgument,
    key2: RedisArgument
  ) {
    parser.push('LCS');
    parser.pushKeys([key1, key2]);
  },
  transformArguments(
    key1: RedisArgument,
    key2: RedisArgument
  ) { return [] },
  transformReply: undefined as unknown as () => BlobStringReply
} as const satisfies Command;
