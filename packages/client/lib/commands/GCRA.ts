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
   * Performs rate limiting using the Generic Cell Rate Algorithm.
   * @param parser - The Redis command parser
   * @param key - Key associated with the rate limit bucket
   * @param maxBurst - Maximum burst size in addition to the sustained rate
   * @param requestsPerPeriod - Number of requests allowed per period
   * @param period - Period in seconds used to calculate the sustained rate
   * @param numRequests - Optional request cost (weight). If omitted, defaults to 1
   * @see https://redis.io/commands/gcra/
   */
  parseCommand(
    parser: CommandParser,
    key: RedisArgument,
    maxBurst: number,
    requestsPerPeriod: number,
    period: number,
    numRequests?: number
  ) {
    parser.push('GCRA');
    parser.pushKey(key);
    parser.push(
      maxBurst.toString(),
      requestsPerPeriod.toString(),
      transformDoubleArgument(period)
    );

    if (numRequests !== undefined) {
      parser.push('NUM_REQUESTS', numRequests.toString());
    }
  },
  transformReply: transformGCRAReply
} as const satisfies Command;
