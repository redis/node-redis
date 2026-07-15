import { CommandParser } from '../client/parser';
import { RedisArgument, ArrayReply, BlobStringReply, Command } from '../RESP/types';

export default {
  parseCommand(parser: CommandParser, pattern?: RedisArgument) {
    parser.push('PUBSUB', 'CHANNELS');

    if (pattern) {
      parser.push(pattern);
    }
  },
  transformReply: undefined as unknown as () => ArrayReply<BlobStringReply>
} as const satisfies Command;

