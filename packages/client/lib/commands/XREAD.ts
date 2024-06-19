import { Command, RedisArgument } from '../RESP/types';
import { CommandParser } from '../client/parser';

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
  FIRST_KEY_INDEX(streams: XReadStreams) {
    return Array.isArray(streams) ? streams[0].key : streams.key;
  },
  IS_READ_ONLY: true,
  parseCommand(parser: CommandParser, streams: XReadStreams, options?: XReadOptions) {
    parser.push('XREAD');

    if (options?.COUNT) {
      parser.pushVariadic(['COUNT', options.COUNT.toString()]);
    }

    if (options?.BLOCK !== undefined) {
      parser.pushVariadic(['BLOCK', options.BLOCK.toString()]);
    }

    pushXReadStreams(parser, streams);
  },
  transformArguments(streams: XReadStreams, options?: XReadOptions) { return [] },
  // export { transformStreamsMessagesReply as transformReply } from './generic-transformers';
  // TODO
  transformReply: undefined as unknown as () => unknown
} as const satisfies Command;

