import { CommandParser } from '../client/parser';
import { ArrayReply, BlobStringReply, NumberReply, Command } from '../RESP/types';

export default {
  NOT_KEYED_COMMAND: true,
  IS_READ_ONLY: true,
  parseCommand(parser: CommandParser) {
    parser.push('LATENCY', 'LATEST');
  },
  transformReply: undefined as unknown as () => ArrayReply<[
    name: BlobStringReply,
    timestamp: NumberReply,
    latestLatency: NumberReply,
    allTimeLatency: NumberReply
  ]>
} as const satisfies Command;

