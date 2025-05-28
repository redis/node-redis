import { CommandParser } from '@redis/client/dist/lib/client/parser';
import { RedisArgument, SimpleStringReply, Command } from '@redis/client/dist/lib/RESP/types';

export default {
  IS_READ_ONLY: false,
  /**
   * Initialize a Count-Min Sketch using error rate and probability parameters
   * @param parser - The command parser
   * @param key - The name of the sketch
   * @param error - Estimate error, as a decimal between 0 and 1
   * @param probability - The desired probability for inflated count, as a decimal between 0 and 1
   */
  parseCommand(parser: CommandParser, key: RedisArgument, error: number, probability: number) {
    parser.push('CMS.INITBYPROB');
    parser.pushKey(key);
    parser.push(error.toString(), probability.toString());
  },
  transformReply: undefined as unknown as () => SimpleStringReply<'OK'>
} as const satisfies Command;
