import { CommandParser } from '../client/parser';
import {
  ArrayReply, BlobStringReply, Command, NumberReply,
  TuplesReply
} from '../RESP/types';

export default {
  CACHEABLE: false,
  IS_READ_ONLY: true,
  /**
   * Constructs the LATENCY HISTOGRAM command
   * 
   * @param parser - The command parser
   * @param commands - The list of redis commands to get histogram for
   * @see https://redis.io/docs/latest/commands/latency-histogram/
   */
  parseCommand(parser: CommandParser, ...commands: string[]) {
    const args = ['LATENCY', 'HISTOGRAM'];
    if (commands.length !== 0) {
      args.push(...commands);
    }
    parser.push(...args);
  },
  transformReply: undefined as unknown as () => ArrayReply<
    BlobStringReply |
    TuplesReply<[
      BlobStringReply,
      NumberReply,
      BlobStringReply,
      NumberReply[],
    ]>
  >
} as const satisfies Command;
