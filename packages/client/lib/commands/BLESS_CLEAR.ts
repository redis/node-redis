import { CommandParser } from '../client/parser';
import { RedisArgument, Command, NumberReply } from '../RESP/types';
import { BlessFlag } from './BLESS_SET';

export default {
  parseCommand(parser: CommandParser, key: RedisArgument, flag: BlessFlag) {
    parser.push('BLESS');
    parser.push('CLEAR');
    parser.pushKey(key);
    parser.push(flag);
  },
  transformReply: undefined as unknown as () => NumberReply
} as const satisfies Command;
