import { CommandParser } from '../client/parser';
import { ArrayReply, Command, RedisArgument } from '../RESP/types';
import { RedisVariadicArgument } from './generic-transformers';
import { SetMemberExpiration } from './SEXPIRE';

export default {
  parseCommand(
    parser: CommandParser,
    key: RedisArgument,
    members: RedisVariadicArgument,
    ms: number,
    mode?: 'NX' | 'XX' | 'GT' | 'LT'
  ) {
    parser.push('SPEXPIRE');
    parser.pushKey(key);
    parser.push(ms.toString());

    if (mode) {
      parser.push(mode);
    }

    parser.push('MEMBERS');
    parser.pushVariadicWithLength(members);
  },
  transformReply: undefined as unknown as () => ArrayReply<SetMemberExpiration>
} as const satisfies Command;
