import { Command, RedisArgument } from '../RESP/types';
import { pushVariadicArgument, RedisVariadicArgument, transformEXAT } from './generic-transformers';
import { HashExpiration } from './HEXPIRE';

export default {
  FIRST_KEY_INDEX: 1,
  transformArguments(
    key: RedisArgument,
    fields: RedisVariadicArgument,
    timestamp: number | Date,
    mode?: 'NX' | 'XX' | 'GT' | 'LT'
  ) {
    const args = [
      'HEXPIREAT',
      key,
      transformEXAT(timestamp)
    ];
  
    if (mode) {
      args.push(mode);
    }
  
    args.push('FIELDS')
  
    return pushVariadicArgument(args, fields);
  },
  transformReply: undefined as unknown as () => Array<HashExpiration>
} as const satisfies Command;
