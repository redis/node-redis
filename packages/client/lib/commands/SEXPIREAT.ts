import { CommandParser } from '../client/parser';
import { ArrayReply, Command, RedisArgument } from '../RESP/types';
import { RedisVariadicArgument, transformEXAT } from './generic-transformers';
import { SetExpiration } from './SEXPIRE';

export default {
  parseCommand(
    parser: CommandParser,
    key: RedisArgument,
    members: RedisVariadicArgument,
    timestamp: number | Date,
    mode?: 'NX' | 'XX' | 'GT' | 'LT'
  ) {
    parser.push('SEXPIREAT');
    parser.pushKey(key);
    parser.push(transformEXAT(timestamp));

    if (mode) {
      parser.push(mode);
    }

    parser.push('MEMBERS');
    parser.pushVariadicWithLength(members);
  },
  transformReply: undefined as unknown as () => ArrayReply<SetExpiration>
} as const satisfies Command;
