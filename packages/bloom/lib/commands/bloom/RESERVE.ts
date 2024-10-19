import { CommandParser } from '@redis/client/lib/client/parser';
import { RedisArgument, SimpleStringReply, Command } from '@redis/client/lib/RESP/types';

export interface BfReserveOptions {
  EXPANSION?: number;
  NONSCALING?: boolean;
}

export default {
  IS_READ_ONLY: true,
  parseCommand(
    parser: CommandParser,
    key: RedisArgument,
    errorRate: number,
    capacity: number,
    options?: BfReserveOptions
  ) {
    parser.push('BF.RESERVE');
    parser.pushKey(key);
    parser.push(errorRate.toString(), capacity.toString());

    if (options?.EXPANSION) {
        parser.push('EXPANSION', options.EXPANSION.toString());
    }

    if (options?.NONSCALING) {
        parser.push('NONSCALING');
    }
  },
  transformReply: undefined as unknown as () => SimpleStringReply<'OK'>
} as const satisfies Command;
