import { CommandParser } from '../client/parser';
import { Command } from '../RESP/types';

type RawHistogram = [string, number, string, number[]];

type Histogram = Record<string, {
  calls: number;
  histogram_usec: number[];
}>;

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
  transformReply(reply: (string | RawHistogram)[]): Histogram {
    const result: Histogram = {};
    if (reply.length === 0) return result;
    for (let i = 1; i < reply.length; i += 2) {
      const histogram = reply[i] as RawHistogram;
      result[reply[i - 1] as string] = {
        calls: histogram[1],
        histogram_usec: histogram[3],
      };
    }
    return result;
  }
} as const satisfies Command;
