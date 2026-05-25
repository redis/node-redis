import { CommandParser } from '../client/parser';
import { RedisArgument, NumberReply, Command } from '../RESP/types';
import { BitValue } from './generic-transformers';

export default {
  IS_READ_ONLY: false,
  parseCommand(parser: CommandParser, key: RedisArgument, offset: number, value: BitValue) {
    parser.push('SETBIT');
    parser.pushKey(key);
    parser.push(offset.toString(), value.toString());
  },
  transformReply: undefined as unknown as () => NumberReply<BitValue>
} as const satisfies Command;
