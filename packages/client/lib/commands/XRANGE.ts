import { CommandParser } from '../client/parser';
import { RedisArgument, ArrayReply, UnwrapReply, Command, TypeMapping } from '../RESP/types';
import { StreamMessageRawReply, transformStreamMessageReply } from './generic-transformers';

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

export default {
  CACHEABLE: true,
  IS_READ_ONLY: true,
  parseCommand(parser: CommandParser, key: RedisArgument, ...args: Parameters<typeof xRangeArguments>) {
    parser.push('XRANGE');
    parser.pushKey(key);
    parser.pushVariadic(xRangeArguments(args[0], args[1], args[2]));
  },
  transformReply(
    reply: UnwrapReply<ArrayReply<StreamMessageRawReply>>,
    preserve?: any,
    typeMapping?: TypeMapping
  ) {
    return reply.map(transformStreamMessageReply.bind(undefined, typeMapping));
  }
} as const satisfies Command;
