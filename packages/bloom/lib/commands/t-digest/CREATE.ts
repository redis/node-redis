import { CommandParser } from '@redis/client/dist/lib/client/parser';
import { RedisArgument, SimpleStringReply, Command } from '@redis/client/dist/lib/RESP/types';

export interface TDigestCreateOptions {
  COMPRESSION?: number;
}

export default {
  IS_READ_ONLY: false,
  /**
   * Creates a new t-digest sketch for storing distributions
   * @param parser - The command parser
   * @param key - The name of the t-digest sketch
   * @param options - Optional parameters for sketch creation
   * @param options.COMPRESSION - Compression parameter that affects performance and accuracy
   */
  parseCommand(parser: CommandParser, key: RedisArgument, options?: TDigestCreateOptions) {
    parser.push('TDIGEST.CREATE');
    parser.pushKey(key);
    
    if (options?.COMPRESSION !== undefined) {
      parser.push('COMPRESSION', options.COMPRESSION.toString());
    }
  },
  transformReply: undefined as unknown as () => SimpleStringReply<'OK'>
} as const satisfies Command;
