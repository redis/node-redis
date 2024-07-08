import { RedisArgument, NumberReply, Command } from '../RESP/types';
import { CommandParser } from '../client/parser';
import { BitValue } from './generic-transformers';

export default {
  FIRST_KEY_INDEX: 1,
  IS_READ_ONLY: false,
  parseCommand(parser: CommandParser, key: RedisArgument, offset: number, value: BitValue) {
    parser.push('SETBIT');
    parser.pushKey(key);
    parser.pushVariadic([offset.toString(), value.toString()]);
  },
  transformArguments(key: RedisArgument, offset: number, value: BitValue) { return [] },
  transformReply: undefined as unknown as () => NumberReply<BitValue>
} as const satisfies Command;
