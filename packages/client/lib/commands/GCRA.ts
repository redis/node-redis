import { CommandParser } from '../client/parser';
import { Command, NumberReply, RedisArgument, TuplesReply, UnwrapReply } from '../RESP/types';
import { transformDoubleArgument } from './generic-transformers';

export type GCRARawReply = TuplesReply<[
  limited: NumberReply<0 | 1>,
  maxRequests: NumberReply,
  availableRequests: NumberReply,
  retryAfter: NumberReply,
  fullBurstAfter: NumberReply
]>;

export interface GCRAReply {
  limited: NumberReply<0 | 1>;
  maxRequests: NumberReply;
  availableRequests: NumberReply;
  retryAfter: NumberReply;
  fullBurstAfter: NumberReply;
}

function transformGCRAReply(reply: UnwrapReply<GCRARawReply>): GCRAReply {
  return {
    limited: reply[0],
    maxRequests: reply[1],
    availableRequests: reply[2],
    retryAfter: reply[3],
    fullBurstAfter: reply[4]
  };
}

export default {
  IS_READ_ONLY: false,
  /**
   * Rate limit via GCRA (Generic Cell Rate Algorithm).
   * `tokensPerPeriod` are allowed per `period` at a sustained rate, which implies
   * a minimum emission interval of `period / tokensPerPeriod` seconds between requests.
   * `maxBurst` allows occasional spikes by permitting up to `maxBurst` additional
   * tokens to be consumed at once.
   * @param parser - The Redis command parser
   * @param key - Key associated with the rate limit bucket
   * @param maxBurst - Maximum number of extra tokens allowed as burst (min 0)
   * @param tokensPerPeriod - Number of tokens allowed per period (min 1)
   * @param period - Period in seconds as a float for sustained rate calculation (min 1.0, max 1e12)
   * @param tokens - Optional request cost (weight). If omitted, defaults to 1
   * @see https://redis.io/commands/gcra/
   */
  parseCommand(
    parser: CommandParser,
    key: RedisArgument,
    maxBurst: number,
    tokensPerPeriod: number,
    period: number,
    tokens?: number
  ) {
    parser.push('GCRA');
    parser.pushKey(key);
    parser.push(
      maxBurst.toString(),
      tokensPerPeriod.toString(),
      transformDoubleArgument(period)
    );

    if (tokens !== undefined) {
      parser.push('TOKENS', tokens.toString());
    }
  },
  transformReply: transformGCRAReply
} as const satisfies Command;
