import { CommandParser } from '@redis/client/lib/client/parser';
import { RedisArgument, SimpleStringReply, Command } from '@redis/client/lib/RESP/types';

export interface CfReserveOptions {
  BUCKETSIZE?: number;
  MAXITERATIONS?: number;
  EXPANSION?: number;
}

export default {
  IS_READ_ONLY: false,
  parseCommand(
    parser: CommandParser,
    key: RedisArgument,
    capacity: number,
    options?: CfReserveOptions
  ) {
    parser.push('CF.RESERVE');
    parser.pushKey(key);
    parser.push(capacity.toString());

    if (options?.BUCKETSIZE !== undefined) {
      parser.push('BUCKETSIZE', options.BUCKETSIZE.toString());
    }

    if (options?.MAXITERATIONS !== undefined) {
      parser.push('MAXITERATIONS', options.MAXITERATIONS.toString());
    }

    if (options?.EXPANSION !== undefined) {
      parser.push('EXPANSION', options.EXPANSION.toString());
    }
  },
  transformReply: undefined as unknown as () => SimpleStringReply<'OK'>
} as const satisfies Command;
