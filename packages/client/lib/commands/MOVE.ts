import { CommandParser } from '../client/parser';
import { RedisArgument, NumberReply, Command } from '../RESP/types';

export default {
  parseCommand(parser: CommandParser, key: RedisArgument, db: number) {
    parser.push('MOVE');
    parser.pushKey(key);
    parser.push(db.toString());
  },
  transformReply: undefined as unknown as () => NumberReply
} as const satisfies Command;
