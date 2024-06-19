import { RedisArgument, ArrayReply, UnwrapReply, Command } from '../RESP/types';
import { CommandParser } from '../client/parser';
import { StreamMessageReply, transformStreamMessageReply } from './generic-transformers';

export interface XRangeOptions {
  COUNT?: number;
}

export function xRangeArguments(
  start: RedisArgument,
  end: RedisArgument,
  options?: XRangeOptions
) {
  const args = [start, end];

  if (options?.COUNT) {
    args.push('COUNT', options.COUNT.toString());
  }

  return args;
}

export function transformXRangeArguments(
  command: RedisArgument,
  key: RedisArgument,
  start: RedisArgument,
  end: RedisArgument,
  options?: XRangeOptions
) {
  return [command, key].concat(...xRangeArguments(start, end, options));
}

export default {
  FIRST_KEY_INDEX: 1,
  IS_READ_ONLY: true,
  parseCommand(parser: CommandParser, key: RedisArgument, ...args: Parameters<typeof xRangeArguments>) {
    parser.setCachable();
    parser.push('XRANGE');
    parser.pushKey(key);
    parser.pushVariadic(xRangeArguments(args[0], args[1], args[2]));
  },
  transformArguments: transformXRangeArguments.bind(undefined, 'XRANGE'),
  transformReply(reply: UnwrapReply<ArrayReply<StreamMessageReply>>) {
    return reply.map(transformStreamMessageReply);
  }
} as const satisfies Command;
