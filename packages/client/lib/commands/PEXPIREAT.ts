import { RedisArgument, NumberReply, Command } from '../RESP/types';
import { CommandParser } from '../client/parser';
import { transformPXAT } from './generic-transformers';

export default {
  FIRST_KEY_INDEX: 1,
  IS_READ_ONLY: true,
  parseCommand(
    parser: CommandParser,
    key: RedisArgument,
    msTimestamp: number | Date,
    mode?: 'NX' | 'XX' | 'GT' | 'LT'
  ) {
    parser.push('PEXPIREAT');
    parser.pushKey(key);
    parser.push(transformPXAT(msTimestamp));

    if (mode) {
      parser.push(mode);
    }
  },
  transformArguments(
    key: RedisArgument,
    msTimestamp: number | Date,
    mode?: 'NX' | 'XX' | 'GT' | 'LT'
  ) { return [] },
  transformReply: undefined as unknown as () => NumberReply
} as const satisfies Command;
