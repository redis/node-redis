import { Command, RedisArgument } from '../RESP/types';
import { transformStreamsMessagesReplyResp2, transformStreamsMessagesReplyResp3 } from './generic-transformers';

export interface XReadStream {
  key: RedisArgument;
  id: RedisArgument;
}

export type XReadStreams = Array<XReadStream> | XReadStream;

export function pushXReadStreams(args: Array<RedisArgument>, streams: XReadStreams) {
  args.push('STREAMS');

  if (Array.isArray(streams)) {
    const keysStart = args.length,
      idsStart = keysStart + streams.length;
    for (let i = 0; i < streams.length; i++) {
      const stream = streams[i];
      args[keysStart + i] = stream.key;
      args[idsStart + i] = stream.id;
    }
  } else {
    args.push(streams.key, streams.id);
  }
}

export interface XReadOptions {
  COUNT?: number;
  BLOCK?: number;
}

export default {
  FIRST_KEY_INDEX(streams: XReadStreams) {
    return Array.isArray(streams) ? streams[0].key : streams.key;
  },
  IS_READ_ONLY: true,
  transformArguments(streams: XReadStreams, options?: XReadOptions) {
    const args: Array<RedisArgument> = ['XREAD'];

    if (options?.COUNT) {
      args.push('COUNT', options.COUNT.toString());
    }

    if (options?.BLOCK !== undefined) {
      args.push('BLOCK', options.BLOCK.toString());
    }

    pushXReadStreams(args, streams);

    return args;
  },
  transformReply: {
    2: transformStreamsMessagesReplyResp2,
    3: transformStreamsMessagesReplyResp3
  }
} as const satisfies Command;

