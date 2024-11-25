import { CommandParser } from '../client/parser';
import { ArrayReply, Command, NullReply, RedisArgument } from '../RESP/types';
import { RedisVariadicArgument } from './generic-transformers';
import { HashExpiration } from './HEXPIRE';

export default {
  parseCommand(
    parser: CommandParser,
    key: RedisArgument, 
    fields: RedisVariadicArgument,
    ms: number,
    mode?: 'NX' | 'XX' | 'GT' | 'LT',
  ) {
    parser.push('HPEXPIRE');
    parser.pushKey(key);
    parser.push(ms.toString());

    if (mode) {
      parser.push(mode);
    }

    parser.push('FIELDS')

    parser.pushVariadicWithLength(fields);
  },
  transformReply: undefined as unknown as () => ArrayReply<HashExpiration> | NullReply
} as const satisfies Command;
