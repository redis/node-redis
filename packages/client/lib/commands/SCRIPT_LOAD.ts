import { CommandParser } from '../client/parser';
import { BlobStringReply, Command, RedisArgument } from '../RESP/types';

export default {
  parseCommand(parser: CommandParser, script: RedisArgument) {
    parser.push('SCRIPT', 'LOAD', script);
  },
  transformReply: undefined as unknown as () => BlobStringReply
} as const satisfies Command;
