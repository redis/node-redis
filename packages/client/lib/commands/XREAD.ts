import { CommandParser } from '../client/parser';
import { Command, RedisArgument, ReplyUnion } from '../RESP/types';
import { transformStreamsMessagesReplyResp2, transformStreamsMessagesReplyResp3 } from './generic-transformers';

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
 * @property BLOCK - Milliseconds to block waiting for new entries (0 for indefinite)
 */
export interface XReadOptions {
  COUNT?: number;
  BLOCK?: number;
}

function transformStreamsMessagesReplyResp3Compat(reply: ReplyUnion) {
  const transformed = transformStreamsMessagesReplyResp3(reply as any);
  if (transformed === null) return null;

  const compat = [];

  if (transformed instanceof Map) {
    for (const [name, messages] of transformed.entries()) {
      compat.push({
        name,
        messages
      });
    }

    return compat;
  }

  if (Array.isArray(transformed)) {
    for (let i = 0; i < transformed.length; i += 2) {
      compat.push({
        name: transformed[i],
        messages: transformed[i + 1]
      });
    }

    return compat;
  }

  for (const [name, messages] of Object.entries(transformed)) {
    compat.push({
      name,
      messages
    });
  }

  return compat;
}

export default {
  IS_READ_ONLY: true,
  /**
   * Constructs the XREAD command to read messages from one or more streams
   *
   * @param parser - The command parser
   * @param streams - Single stream or array of streams to read from
   * @param options - Additional options for reading streams
   * @returns Array of stream entries, each containing the stream name and its messages
   * @see https://redis.io/commands/xread/
   */
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
  /**
   * Transform functions for different RESP versions
   */
  transformReply: {
    2: transformStreamsMessagesReplyResp2,
    3: transformStreamsMessagesReplyResp3Compat
  }
} as const satisfies Command;
