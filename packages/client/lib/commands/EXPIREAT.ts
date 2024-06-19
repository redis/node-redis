import { RedisArgument, NumberReply, Command } from '../RESP/types';
import { CommandParser } from '../client/parser';
import { transformEXAT } from './generic-transformers';

export default {
  FIRST_KEY_INDEX: 1,
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
  transformArguments(
    key: RedisArgument,
    timestamp: number | Date,
    mode?: 'NX' | 'XX' | 'GT' | 'LT'
  ) { return [] },
  transformReply: undefined as unknown as () => NumberReply
} as const satisfies Command;
