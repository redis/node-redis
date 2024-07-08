import { RedisArgument, NumberReply, Command } from '../RESP/types';
import { CommandParser } from '../client/parser';

export default {
  FIRST_KEY_INDEX: 1,
  parseCommand(parser: CommandParser, key: RedisArgument, db: number) {
    parser.push('MOVE');
    parser.pushKey(key);
    parser.push(db.toString());
  },
  transformArguments(key: RedisArgument, db: number) { return [] },
  transformReply: undefined as unknown as () => NumberReply
} as const satisfies Command;
