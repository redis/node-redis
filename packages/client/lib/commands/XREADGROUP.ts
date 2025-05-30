import { CommandParser } from '../client/parser';
import { Command, RedisArgument, ReplyUnion } from '../RESP/types';
import { XReadStreams, pushXReadStreams } from './XREAD';
import { transformStreamsMessagesReplyResp2 } from './generic-transformers';

/**
 * Options for the XREADGROUP command
 * 
 * @property COUNT - Limit the number of entries returned per stream
 * @property BLOCK - Milliseconds to block waiting for new entries (0 for indefinite)
 * @property NOACK - Skip adding the message to the PEL (Pending Entries List)
 */
export interface XReadGroupOptions {
  COUNT?: number;
  BLOCK?: number;
  NOACK?: boolean;
}

export default {
  IS_READ_ONLY: true,
  /**
   * Constructs the XREADGROUP command to read messages from streams as a consumer group member
   *
   * @param parser - The command parser
   * @param group - Name of the consumer group
   * @param consumer - Name of the consumer in the group
   * @param streams - Single stream or array of streams to read from
   * @param options - Additional options for reading streams
   * @returns Array of stream entries, each containing the stream name and its messages
   * @see https://redis.io/commands/xreadgroup/
   */
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
  /**
   * Transform functions for different RESP versions
   */
  transformReply: {
    2: transformStreamsMessagesReplyResp2,
    3: undefined as unknown as () => ReplyUnion
  },
  unstableResp3: true,
} as const satisfies Command;
