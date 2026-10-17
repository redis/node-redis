import { CommandParser } from '../client/parser';
import { RedisArgument, Command, NumberReply } from '../RESP/types';

export type BlessFlag = 'NO-EVICT';

export default {
  parseCommand(parser: CommandParser, key: RedisArgument, flag: BlessFlag) {
    parser.push('BLESS');
    parser.push('SET');
    parser.pushKey(key);
    parser.push(flag);
  },
  transformReply: undefined as unknown as () => NumberReply
} as const satisfies Command;
