import { RedisArgument, SimpleStringReply, Command } from '../RESP/types';
import { CommandParser } from '../client/parser';

export interface AuthOptions {
  username?: RedisArgument;
  password: RedisArgument;
}

export default {
  FIRST_KEY_INDEX: undefined,
  IS_READ_ONLY: true,
  parseCommand(parser: CommandParser, { username, password }: AuthOptions) {
    parser.push('AUTH');
    if (username !== undefined) {
      parser.push(username);
    }
    parser.push(password);
  },
  transformArguments({ username, password }: AuthOptions) { return [] },
  transformReply: undefined as unknown as () => SimpleStringReply<'OK'>
} as const satisfies Command;
