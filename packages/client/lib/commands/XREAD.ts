import { CommandParser } from '../client/parser';
import { Command, RedisArgument } from '../RESP/types';
import { transformStreamsMessagesReplyResp2, transformStreamsMessagesReplyResp3Compat } from './generic-transformers';

/**
 * Structure representing a stream to read from
 * 
 * @property key - The stream key
 * @property id - The message ID to start reading from
 */
export interface XReadStream {
  key: RedisArgument;
  id: RedisArgument;
}

export type XReadStreams = Array<XReadStream> | XReadStream;

/**
 * Helper function to push stream keys and IDs to the command parser
 * 
 * @param parser - The command parser
 * @param streams - Single stream or array of streams to read from
 */
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

/**
 * Options for the XREAD command
 *
 * @property COUNT - Limit the number of entries returned per stream
 * @property MAXCOUNT - Cumulative cap on the total number of entries returned across all streams (Redis 8.10+)
 * @property MAXSIZE - Soft cumulative cap on the total server reply size in bytes across all streams (Redis 8.10+)
 * @property BLOCK - Milliseconds to block waiting for new entries (0 for indefinite)
 */
export interface XReadOptions {
  COUNT?: number;
  MAXCOUNT?: number;
  MAXSIZE?: number;
  BLOCK?: number;
}

export default {
  IS_READ_ONLY: true,
  parseCommand(parser: CommandParser, streams: XReadStreams, options?: XReadOptions) {
    parser.push('XREAD');

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

    pushXReadStreams(parser, streams);
  },
  /**
   * Transform functions for different RESP versions
   */
  transformReply: {
    2: transformStreamsMessagesReplyResp2,
    3: transformStreamsMessagesReplyResp3Compat
  }
} as const satisfies Command;
