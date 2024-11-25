import { CommandParser } from '../client/parser';
import { Command, RedisArgument } from '../RESP/types';
import XRANGE, { xRangeArguments } from './XRANGE';

export interface XRevRangeOptions {
  COUNT?: number;
}

export default {
  CACHEABLE: XRANGE.CACHEABLE,
  IS_READ_ONLY: XRANGE.IS_READ_ONLY,
  parseCommand(parser: CommandParser, key: RedisArgument, ...args: Parameters<typeof xRangeArguments>) {
    parser.push('XREVRANGE');
    parser.pushKey(key);
    parser.pushVariadic(xRangeArguments(args[0], args[1], args[2]));
  },
  transformReply: XRANGE.transformReply
} as const satisfies Command;
