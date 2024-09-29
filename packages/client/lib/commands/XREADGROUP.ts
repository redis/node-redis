import { Command, RedisArgument, ReplyUnion } from '../RESP/types';
import { transformStreamsMessagesReplyResp2 } from './generic-transformers';
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
    const args = ['XREADGROUP', 'GROUP', group, consumer];

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
  transformReply: {
    2: transformStreamsMessagesReplyResp2,
    3: undefined as unknown as () => ReplyUnion
  },
  unstableResp3: true,
} as const satisfies Command;
