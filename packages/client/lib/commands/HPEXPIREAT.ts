import { CommandParser } from '../client/parser';
import { ArrayReply, Command, NullReply, RedisArgument } from '../RESP/types';
import { RedisVariadicArgument, transformPXAT } from './generic-transformers';
import { HashExpiration } from './HEXPIRE';

export default {
  IS_READ_ONLY: true,
  parseCommand(
    parser: CommandParser,
    key: RedisArgument,
    fields: RedisVariadicArgument,
    timestamp: number | Date,
    mode?: 'NX' | 'XX' | 'GT' | 'LT'
  ) {
    parser.push('HPEXPIREAT');
    parser.pushKey(key);
    parser.push(transformPXAT(timestamp));

    if (mode) {
      parser.push(mode);
    }

    parser.push('FIELDS')

    parser.pushVariadicWithLength(fields);
  },
  transformReply: undefined as unknown as () => ArrayReply<HashExpiration> | NullReply
} as const satisfies Command;
