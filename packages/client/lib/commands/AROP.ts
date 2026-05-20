import { CommandParser } from '../client/parser';
import { RedisArgument, BlobStringReply, NumberReply, NullReply, Command } from '../RESP/types';

export const AR_OPERATIONS = {
  SUM: 'SUM',
  MIN: 'MIN',
  MAX: 'MAX',
  AND: 'AND',
  OR: 'OR',
  XOR: 'XOR',
  MATCH: 'MATCH',
  USED: 'USED'
} as const;

export type ArOperation = typeof AR_OPERATIONS[keyof typeof AR_OPERATIONS];

export default {
  IS_READ_ONLY: true,
  parseCommand(
    parser: CommandParser,
    key: RedisArgument,
    start: number | string,
    end: number | string,
    operation: ArOperation,
    value?: RedisArgument | number
  ) {
    parser.push('AROP');
    parser.pushKey(key);
    parser.push(start.toString(), end.toString(), operation);

    if (value !== undefined) {
      parser.push(typeof value === 'number' ? value.toString() : value);
    }
  },
  transformReply: undefined as unknown as () => BlobStringReply | NumberReply | NullReply
} as const satisfies Command;
