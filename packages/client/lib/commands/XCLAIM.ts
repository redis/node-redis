import { RedisArgument, ArrayReply, NullReply, UnwrapReply, Command } from '../RESP/types';
import { CommandParser } from '../client/parser';
import { RedisVariadicArgument, StreamMessageReply, transformStreamMessageNullReply } from './generic-transformers';

export interface XClaimOptions {
  IDLE?: number;
  TIME?: number | Date;
  RETRYCOUNT?: number;
  FORCE?: boolean;
  LASTID?: RedisArgument;
}

export default {
  FIRST_KEY_INDEX: 1,
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
    parser.pushVariadic([group, consumer, minIdleTime.toString()]);
    parser.pushVariadic(id);

    if (options?.IDLE !== undefined) {
      parser.pushVariadic(['IDLE', options.IDLE.toString()]);
    }

    if (options?.TIME !== undefined) {
      parser.pushVariadic(
        [
          'TIME',
          (options.TIME instanceof Date ? options.TIME.getTime() : options.TIME).toString()
        ]
      );
    }

    if (options?.RETRYCOUNT !== undefined) {
      parser.pushVariadic(['RETRYCOUNT', options.RETRYCOUNT.toString()]);
    }

    if (options?.FORCE) {
      parser.push('FORCE');
    }

    if (options?.LASTID !== undefined) {
      parser.pushVariadic(['LASTID', options.LASTID]);
    }
  },
  transformArguments(
    key: RedisArgument,
    group: RedisArgument,
    consumer: RedisArgument,
    minIdleTime: number,
    id: RedisVariadicArgument,
    options?: XClaimOptions
  ) { return [] },
  transformReply(reply: UnwrapReply<ArrayReply<StreamMessageReply | NullReply>>) {
    return reply.map(transformStreamMessageNullReply);
  }
} as const satisfies Command;
