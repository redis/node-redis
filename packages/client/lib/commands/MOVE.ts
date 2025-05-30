import { CommandParser } from '../client/parser';
import { RedisArgument, NumberReply, Command } from '../RESP/types';

export default {
  /**
   * Constructs the MOVE command
   * 
   * @param parser - The command parser
   * @param key - The key to move
   * @param db - The destination database index
   * @see https://redis.io/commands/move/
   */
  parseCommand(parser: CommandParser, key: RedisArgument, db: number) {
    parser.push('MOVE');
    parser.pushKey(key);
    parser.push(db.toString());
  },
  transformReply: undefined as unknown as () => NumberReply
} as const satisfies Command;
