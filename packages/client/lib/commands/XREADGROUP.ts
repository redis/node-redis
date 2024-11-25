import { CommandParser } from '../client/parser';
import { Command, RedisArgument, ReplyUnion } from '../RESP/types';
import { XReadStreams, pushXReadStreams } from './XREAD';
import { transformStreamsMessagesReplyResp2 } from './generic-transformers';

export interface XReadGroupOptions {
  COUNT?: number;
  BLOCK?: number;
  NOACK?: boolean;
}

export default {
  IS_READ_ONLY: true,
  parseCommand(
    parser: CommandParser,
    group: RedisArgument,
    consumer: RedisArgument,
    streams: XReadStreams,
    options?: XReadGroupOptions
  ) {
    parser.push('XREADGROUP', 'GROUP', group, consumer);

    if (options?.COUNT !== undefined) {
      parser.push('COUNT', options.COUNT.toString());
    }

    if (options?.BLOCK !== undefined) {
      parser.push('BLOCK', options.BLOCK.toString());
    }

    if (options?.NOACK) {
      parser.push('NOACK');
    }

    pushXReadStreams(parser, streams);
  },
  transformReply: {
    2: transformStreamsMessagesReplyResp2,
    3: undefined as unknown as () => ReplyUnion
  },
  unstableResp3: true,
} as const satisfies Command;
