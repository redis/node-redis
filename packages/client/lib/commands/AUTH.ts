import { CommandParser } from '../client/parser';
import { RedisArgument, SimpleStringReply, Command } from '../RESP/types';

export interface AuthOptions {
  username?: RedisArgument;
  password: RedisArgument;
}

export default {
  NOT_KEYED_COMMAND: true,
  IS_READ_ONLY: true,
  parseCommand(parser: CommandParser, { username, password }: AuthOptions) {
    parser.push('AUTH');
    if (username !== undefined) {
      parser.push(username);
    }
    parser.push(password);
  },
  transformReply: undefined as unknown as () => SimpleStringReply<'OK'>
} as const satisfies Command;
