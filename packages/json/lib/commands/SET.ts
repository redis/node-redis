import { RedisArgument, SimpleStringReply, NullReply, Command } from '@redis/client/dist/lib/RESP/types';
import { RedisJSON, transformRedisJsonArgument } from '.';

export interface NX {
  NX: true;
}

export interface XX {
  XX: true;
}

export default {
  FIRST_KEY_INDEX: 1,
  IS_READ_ONLY: false,
  transformArguments(key: RedisArgument, path: RedisArgument, json: RedisJSON, options?: NX | XX) {
    const args = ['JSON.SET', key, path, transformRedisJsonArgument(json)];

    if ((<NX>options)?.NX) {
      args.push('NX');
    } else if ((<XX>options)?.XX) {
      args.push('XX');
    }

    return args;
  },
  transformReply: undefined as unknown as () => SimpleStringReply<'OK'> | NullReply
} as const satisfies Command;
