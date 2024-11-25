import { CommandParser } from '../client/parser';
import { Command, RedisArgument, ReplyUnion } from '../RESP/types';
import { transformStreamsMessagesReplyResp2 } from './generic-transformers';

export interface XReadStream {
  key: RedisArgument;
  id: RedisArgument;
}

export type XReadStreams = Array<XReadStream> | XReadStream;

export function pushXReadStreams(parser: CommandParser, streams: XReadStreams) {
  parser.push('STREAMS');

  if (Array.isArray(streams)) {
    for (let i = 0; i < streams.length; i++) {
      parser.pushKey(streams[i].key);
    }
    for (let i = 0; i < streams.length; i++) {
      parser.push(streams[i].id);
    }
  } else {
    parser.pushKey(streams.key);
    parser.push(streams.id);
  }
}

export interface XReadOptions {
  COUNT?: number;
  BLOCK?: number;
}

export default {
  IS_READ_ONLY: true,
  parseCommand(parser: CommandParser, streams: XReadStreams, options?: XReadOptions) {
    parser.push('XREAD');

    if (options?.COUNT) {
      parser.push('COUNT', options.COUNT.toString());
    }

    if (options?.BLOCK !== undefined) {
      parser.push('BLOCK', options.BLOCK.toString());
    }

    pushXReadStreams(parser, streams);
  },
  transformReply: {
    2: transformStreamsMessagesReplyResp2,
    3: undefined as unknown as () => ReplyUnion
  },
  unstableResp3: true
} as const satisfies Command;
