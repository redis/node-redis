import { ArrayReply, BlobStringReply, NumberReply, Command } from '../RESP/types';
import { CommandParser } from '../client/parser';

export default {
  FIRST_KEY_INDEX: undefined,
  IS_READ_ONLY: true,
  parseCommand(parser: CommandParser) {
    parser.pushVariadic(['LATENCY', 'LATEST']);
  },
  transformArguments() {
    return ['LATENCY', 'LATEST'];
  },
  transformReply: undefined as unknown as () => ArrayReply<[
    name: BlobStringReply,
    timestamp: NumberReply,
    latestLatency: NumberReply,
    allTimeLatency: NumberReply
  ]>
} as const satisfies Command;

