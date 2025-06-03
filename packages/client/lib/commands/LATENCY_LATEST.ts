import { CommandParser } from '../client/parser';
import { ArrayReply, BlobStringReply, NumberReply, Command } from '../RESP/types';

export default {
  NOT_KEYED_COMMAND: true,
  IS_READ_ONLY: true,
  /**
   * Constructs the LATENCY LATEST command
   * 
   * @param parser - The command parser
   * @see https://redis.io/commands/latency-latest/
   */
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

