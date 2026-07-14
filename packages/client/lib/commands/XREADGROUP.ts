import { CommandParser } from '../client/parser';
import { Command, RedisArgument } from '../RESP/types';
import { XReadStreams, pushXReadStreams } from './XREAD';
import { transformStreamsMessagesReplyResp2, transformStreamsMessagesReplyResp3Compat } from './generic-transformers';

/**
 * Options for the XREADGROUP command
 *
 * @property COUNT - Limit the number of entries returned per stream
 * @property MAXCOUNT - Cumulative cap on the total number of entries returned across all streams (Redis 8.10+)
 * @property MAXSIZE - Soft cumulative cap on the total server reply size in bytes across all streams (Redis 8.10+)
 * @property BLOCK - Milliseconds to block waiting for new entries (0 for indefinite)
 * @property NOACK - Skip adding the message to the PEL (Pending Entries List)
 * @property CLAIM - Prepend PEL entries that are at least this many milliseconds old
 */
export interface XReadGroupOptions {
  COUNT?: number;
  MAXCOUNT?: number;
  MAXSIZE?: number;
  BLOCK?: number;
  NOACK?: boolean;
  CLAIM?: number;
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

    if (options?.MAXCOUNT !== undefined) {
      parser.push('MAXCOUNT', options.MAXCOUNT.toString());
    }

    if (options?.MAXSIZE !== undefined) {
      parser.push('MAXSIZE', options.MAXSIZE.toString());
    }

    if (options?.BLOCK !== undefined) {
      parser.push('BLOCK', options.BLOCK.toString());
    }

    if (options?.CLAIM !== undefined) {
      parser.push('CLAIM', options.CLAIM.toString());
    }

    if (options?.NOACK) {
      parser.push('NOACK');
    }

    pushXReadStreams(parser, streams);
  },
  /**
   * Transform functions for different RESP versions
   */
  transformReply: {
    2: transformStreamsMessagesReplyResp2,
    3: transformStreamsMessagesReplyResp3Compat
  },
} as const satisfies Command;
