import { BlobStringReply, Command, RedisArgument } from '../RESP/types';
import { CommandParser } from '../client/parser';

export default {
  FIRST_KEY_INDEX: undefined,
  IS_READ_ONLY: true,
  parseCommand(parser: CommandParser, script: RedisArgument) {
    parser.pushVariadic(['SCRIPT', 'LOAD', script]);
  },
  transformArguments(script: RedisArgument) { return [] },
  transformReply: undefined as unknown as () => BlobStringReply
} as const satisfies Command;
