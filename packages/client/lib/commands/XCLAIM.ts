import { RedisArgument, ArrayReply, NullReply, UnwrapReply, Command } from '../RESP/types';
import { RedisVariadicArgument, pushVariadicArguments, StreamMessageRawReply, transformStreamMessageNullReply } from './generic-transformers';

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
  transformArguments(
    key: RedisArgument,
    group: RedisArgument,
    consumer: RedisArgument,
    minIdleTime: number,
    id: RedisVariadicArgument,
    options?: XClaimOptions
  ) {
    const args = pushVariadicArguments(
      ['XCLAIM', key, group, consumer, minIdleTime.toString()],
      id
    );

    if (options?.IDLE !== undefined) {
      args.push('IDLE', options.IDLE.toString());
    }

    if (options?.TIME !== undefined) {
      args.push(
        'TIME',
        (options.TIME instanceof Date ? options.TIME.getTime() : options.TIME).toString()
      );
    }

    if (options?.RETRYCOUNT !== undefined) {
      args.push('RETRYCOUNT', options.RETRYCOUNT.toString());
    }

    if (options?.FORCE) {
      args.push('FORCE');
    }

    if (options?.LASTID !== undefined) {
      args.push('LASTID', options.LASTID);
    }

    return args;
  },
  transformReply(reply: UnwrapReply<ArrayReply<StreamMessageRawReply | NullReply>>) {
    return reply.map(transformStreamMessageNullReply);
  }
} as const satisfies Command;
