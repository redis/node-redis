import { NumberReply, Command, RedisArgument } from '../RESP/types';
import { CommandParser } from '../client/parser';
import { BitValue } from './generic-transformers';

export default {
  FIRST_KEY_INDEX: 1,
  IS_READ_ONLY: true,
  parseCommand(parser: CommandParser, key: RedisArgument, offset: number) {
    parser.setCachable();
    parser.push('GETBIT');
    parser.pushKey(key);
    parser.push(offset.toString());
  },
  transformArguments(key: RedisArgument, offset: number) { return [] },
  transformReply: undefined as unknown as () => NumberReply<BitValue>
} as const satisfies Command;
