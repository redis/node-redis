import { Command, RedisArgument } from '../RESP/types';
import { CommandParser } from '../client/parser';
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
  parseCommand(
    parser: CommandParser,
    group: RedisArgument,
    consumer: RedisArgument,
    streams: XReadStreams,
    options?: XReadGroupOptions
  ) {
    parser.pushVariadic(['XREADGROUP', 'GROUP', group, consumer]);

    if (options?.COUNT !== undefined) {
      parser.pushVariadic(['COUNT', options.COUNT.toString()]);
    }

    if (options?.BLOCK !== undefined) {
      parser.pushVariadic(['BLOCK', options.BLOCK.toString()]);
    }

    if (options?.NOACK) {
      parser.push('NOACK');
    }

    pushXReadStreams(parser, streams);
  },
  transformArguments(
    group: RedisArgument,
    consumer: RedisArgument,
    streams: XReadStreams,
    options?: XReadGroupOptions
  ) { return [] },
  // export { transformStreamsMessagesReply as transformReply } from './generic-transformers';
  // TODO
  transformReply: undefined as unknown as () => unknown
} as const satisfies Command;
