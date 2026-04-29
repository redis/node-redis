import { CommandParser } from '../client/parser';
import { RedisArgument, ArrayReply, NullReply, UnwrapReply, Command, TypeMapping } from '../RESP/types';
import { RedisVariadicArgument, StreamMessageRawReply, transformStreamMessageNullReply } from './generic-transformers';

/**
 * Options for the XCLAIM command
 * 
 * @property IDLE - Set the idle time (in milliseconds) for the claimed messages
 * @property TIME - Set the last delivery time (Unix timestamp or Date)
 * @property RETRYCOUNT - Set the retry counter for the claimed messages
 * @property FORCE - Create the pending message entry even if the message doesn't exist
 * @property LASTID - Update the consumer group last ID
 */
export interface XClaimOptions {
  IDLE?: number;
  TIME?: number | Date;
  RETRYCOUNT?: number;
  FORCE?: boolean;
  LASTID?: RedisArgument;
}

export default {
  IS_READ_ONLY: false,
  parseCommand(
    parser: CommandParser,
    key: RedisArgument,
    group: RedisArgument,
    consumer: RedisArgument,
    minIdleTime: number,
    id: RedisVariadicArgument,
    options?: XClaimOptions
  ) {
    parser.push('XCLAIM');
    parser.pushKey(key);
    parser.push(group, consumer, minIdleTime.toString());
    parser.pushVariadic(id);

    if (options?.IDLE !== undefined) {
      parser.push('IDLE', options.IDLE.toString());
    }

    if (options?.TIME !== undefined) {
      parser.push(
        'TIME',
        (options.TIME instanceof Date ? options.TIME.getTime() : options.TIME).toString()
      );
    }

    if (options?.RETRYCOUNT !== undefined) {
      parser.push('RETRYCOUNT', options.RETRYCOUNT.toString());
    }

    if (options?.FORCE) {
      parser.push('FORCE');
    }

    if (options?.LASTID !== undefined) {
      parser.push('LASTID', options.LASTID);
    }
  },
  /**
   * Transforms the raw XCLAIM reply into an array of messages
   * 
   * @param reply - Raw reply from Redis
   * @param preserve - Preserve options (unused)
   * @param typeMapping - Type mapping for message fields
   * @returns Array of claimed messages with their fields
   */
  transformReply(
    reply: UnwrapReply<ArrayReply<StreamMessageRawReply | NullReply>>, 
    preserve?: unknown,
    typeMapping?: TypeMapping
  ) {
    return reply.map(transformStreamMessageNullReply.bind(undefined, typeMapping));
  }
} as const satisfies Command;
