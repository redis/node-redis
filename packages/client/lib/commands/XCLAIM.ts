import { CommandParser } from '../client/parser';
import { RedisArgument, ArrayReply, NullReply, UnwrapReply, Command, TypeMapping } from '../RESP/types';
import { RedisVariadicArgument, StreamMessageRawReply, transformStreamMessageNullReply } from './generic-transformers';

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
  transformReply(
    reply: UnwrapReply<ArrayReply<StreamMessageRawReply | NullReply>>, 
    preserve?: any,
    typeMapping?: TypeMapping
  ) {
    return reply.map(transformStreamMessageNullReply.bind(undefined, typeMapping));
  }
} as const satisfies Command;
