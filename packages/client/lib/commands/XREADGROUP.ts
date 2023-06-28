import { Command, RedisArgument } from '../RESP/types';
import XREAD, { XReadStreams, pushXReadStreams } from './XREAD';

export interface XReadGroupOptions {
  COUNT?: number;
  BLOCK?: number;
  NOACK?: boolean;
}

export default {
  FIRST_KEY_INDEX(
    _group: RedisArgument,
    _consumer: RedisArgument,
    streams: XReadStreams
  ) {
    return XREAD.FIRST_KEY_INDEX(streams);
  },
  IS_READ_ONLY: true,
  transformArguments(
    group: RedisArgument,
    consumer: RedisArgument,
    streams: XReadStreams,
    options?: XReadGroupOptions
  ) {
    const args = ['XREADGROUP', group, consumer];

    if (options?.COUNT !== undefined) {
      args.push('COUNT', options.COUNT.toString());
    }

    if (options?.BLOCK !== undefined) {
      args.push('BLOCK', options.BLOCK.toString());
    }

    if (options?.NOACK) {
      args.push('NOACK');
    }

    pushXReadStreams(args, streams);

    return args;
  },
  // export { transformStreamsMessagesReply as transformReply } from './generic-transformers';
  // TODO
  transformReply: undefined as unknown as () => unknown
} as const satisfies Command;
