import { Command, RedisArgument } from '../RESP/types';
import { CommandParser } from '../client/parser';
import XRANGE, { transformXRangeArguments, xRangeArguments } from './XRANGE';

export interface XRevRangeOptions {
  COUNT?: number;
}

export default {
  FIRST_KEY_INDEX: XRANGE.FIRST_KEY_INDEX,
  IS_READ_ONLY: XRANGE.IS_READ_ONLY,
  parseCommand(parser: CommandParser, key: RedisArgument, ...args: Parameters<typeof xRangeArguments>) {
    parser.setCachable();
    parser.push('XREVRANGE');
    parser.pushKey(key);
    parser.pushVariadic(xRangeArguments(args[0], args[1], args[2]));
  },
  transformArguments: transformXRangeArguments.bind(undefined, 'XREVRANGE'),
  transformReply: XRANGE.transformReply
} as const satisfies Command;
