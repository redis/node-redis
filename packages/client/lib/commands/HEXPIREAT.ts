import { CommandParser } from '../client/parser';
import { RedisVariadicArgument, transformEXAT } from './generic-transformers';
import { ArrayReply, Command, NumberReply, RedisArgument } from '../RESP/types';

export default {
  parseCommand(
    parser: CommandParser,
    key: RedisArgument,
    fields: RedisVariadicArgument,
    timestamp: number | Date,
    mode?: 'NX' | 'XX' | 'GT' | 'LT'
  ) {
    parser.push('HEXPIREAT');
    parser.pushKey(key);
    parser.push(transformEXAT(timestamp));

    if (mode) {
      parser.push(mode);
    }

    parser.push('FIELDS')

    parser.pushVariadicWithLength(fields);
  },
  transformReply: undefined as unknown as () => ArrayReply<NumberReply>
} as const satisfies Command;
