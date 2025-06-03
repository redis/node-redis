import { CommandParser } from '@redis/client/dist/lib/client/parser';
import { RedisArgument, TuplesReply, NumberReply, DoubleReply, UnwrapReply, Resp2Reply, Command } from '@redis/client/dist/lib/RESP/types';

export interface TsGetOptions {
  LATEST?: boolean;
}

export type TsGetReply = TuplesReply<[]> | TuplesReply<[NumberReply, DoubleReply]>;

export default {
  IS_READ_ONLY: true,
  /**
   * Gets the last sample of a time series
   * @param parser - The command parser
   * @param key - The key name of the time series
   * @param options - Optional parameters for the command
   */
  parseCommand(parser: CommandParser, key: RedisArgument, options?: TsGetOptions) {
    parser.push('TS.GET');
    parser.pushKey(key);
    
    if (options?.LATEST) {
      parser.push('LATEST');
    }
  },
  transformReply: {
    2(reply: UnwrapReply<Resp2Reply<TsGetReply>>) {
      return reply.length === 0 ? null : {
        timestamp: reply[0],
        value: Number(reply[1])
      };
    },
    3(reply: UnwrapReply<TsGetReply>) {
      return reply.length === 0 ? null : {
        timestamp: reply[0],
        value: reply[1]
      };
    }
  }
} as const satisfies Command;
