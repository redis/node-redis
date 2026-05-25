import { CommandParser } from '../client/parser';
import { RedisArgument, NumberReply, Command } from '../RESP/types';
import { BitValue } from './generic-transformers';

export default {
  CACHEABLE: true,
  IS_READ_ONLY: true,
  parseCommand(parser: CommandParser,
    key: RedisArgument,
    bit: BitValue,
    start?: number,
    end?: number,
    mode?: 'BYTE' | 'BIT'
  ) {
    parser.push('BITPOS');
    parser.pushKey(key);
    parser.push(bit.toString());

    if (start !== undefined) {
      parser.push(start.toString());
    }

    if (end !== undefined) {
      parser.push(end.toString());
    }

    if (mode) {
      parser.push(mode);
    }
  },
  transformReply: undefined as unknown as () => NumberReply
} as const satisfies Command;
