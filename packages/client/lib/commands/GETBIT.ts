import { CommandParser } from '../client/parser';
import { NumberReply, Command, RedisArgument } from '../RESP/types';
import { BitValue } from './generic-transformers';

export default {
  CACHEABLE: true,
  IS_READ_ONLY: true,
  parseCommand(parser: CommandParser, key: RedisArgument, offset: number) {
    parser.push('GETBIT');
    parser.pushKey(key);
    parser.push(offset.toString());
  },
  transformReply: undefined as unknown as () => NumberReply<BitValue>
} as const satisfies Command;
