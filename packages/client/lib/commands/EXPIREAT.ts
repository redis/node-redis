import { CommandParser } from '../client/parser';
import { RedisArgument, NumberReply, Command } from '../RESP/types';
import { transformEXAT } from './generic-transformers';

export default {
  IS_READ_ONLY: true,
  parseCommand(
    parser: CommandParser,
    key: RedisArgument,
    timestamp: number | Date,
    mode?: 'NX' | 'XX' | 'GT' | 'LT'
  ) {
    parser.push('EXPIREAT');
    parser.pushKey(key);
    parser.push(transformEXAT(timestamp));
    if (mode) {
      parser.push(mode);
    }
  },
  transformReply: undefined as unknown as () => NumberReply
} as const satisfies Command;
