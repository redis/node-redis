import { CommandParser } from '@redis/client/lib/client/parser';
import { RedisArgument, SimpleStringReply, Command } from '@redis/client/lib/RESP/types';

export interface TDigestCreateOptions {
  COMPRESSION?: number;
}

export default {
  IS_READ_ONLY: false,
  parseCommand(parser: CommandParser, key: RedisArgument, options?: TDigestCreateOptions) {
    parser.push('TDIGEST.CREATE');
    parser.pushKey(key);
    
    if (options?.COMPRESSION !== undefined) {
      parser.push('COMPRESSION', options.COMPRESSION.toString());
    }
  },
  transformReply: undefined as unknown as () => SimpleStringReply<'OK'>
} as const satisfies Command;
