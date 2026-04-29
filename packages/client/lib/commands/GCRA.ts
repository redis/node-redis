import { CommandParser } from '../client/parser';
import { BooleanReply, Command, NumberReply, RedisArgument, TuplesReply, UnwrapReply } from '../RESP/types';
import { transformDoubleArgument } from './generic-transformers';

export type GCRARawReply = TuplesReply<[
  limited: NumberReply<0 | 1>,
  maxRequests: NumberReply,
  availableRequests: NumberReply,
  retryAfter: NumberReply,
  fullBurstAfter: NumberReply
]>;

export interface GCRAReply {
  limited: BooleanReply;
  maxRequests: NumberReply;
  availableRequests: NumberReply;
  retryAfter: NumberReply;
  fullBurstAfter: NumberReply;
}

function transformGCRAReply(reply: UnwrapReply<GCRARawReply>): GCRAReply {
  return {
    limited: (reply[0] as unknown as number === 1) as unknown as BooleanReply,
    maxRequests: reply[1],
    availableRequests: reply[2],
    retryAfter: reply[3],
    fullBurstAfter: reply[4]
  };
}

export default {
  IS_READ_ONLY: false,
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
