import { ArrayReply, Command, NullReply, RedisArgument } from '../RESP/types';
import { pushVariadicArgument, RedisVariadicArgument, transformPXAT } from './generic-transformers';
import { HashExpiration } from './HEXPIRE';

export default {
  FIRST_KEY_INDEX: 1,
  transformArguments(
    key: RedisArgument,
    fields: RedisVariadicArgument,
    timestamp: number | Date,
    mode?: 'NX' | 'XX' | 'GT' | 'LT'
  ) {
    const args = ['HPEXPIREAT', key, transformPXAT(timestamp)];

    if (mode) {
      args.push(mode);
    }

    args.push('FIELDS')

    return pushVariadicArgument(args, fields);
  },
  transformReply: undefined as unknown as () => ArrayReply<HashExpiration> | NullReply
} as const satisfies Command;