import { CommandParser } from '../client/parser';
import { RedisArgument, NumberReply, NullReply, Command } from '../RESP/types';

export default {
  parseCommand(parser: CommandParser, key: RedisArgument) {
    parser.push('OBJECT', 'REFCOUNT');
    parser.pushKey(key);
  },
  transformReply: undefined as unknown as () => NumberReply | NullReply
} as const satisfies Command;
