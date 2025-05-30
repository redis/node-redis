import { CommandParser } from '../client/parser';
import { RedisArgument, SimpleStringReply, Command } from '../RESP/types';

export interface AuthOptions {
  username?: RedisArgument;
  password: RedisArgument;
}

export default {
  NOT_KEYED_COMMAND: true,
  IS_READ_ONLY: true,
  /**
   * Authenticates the connection using a password or username and password
   * @param parser - The Redis command parser
   * @param options - Authentication options containing username and/or password
   * @param options.username - Optional username for authentication
   * @param options.password - Password for authentication
   */
  parseCommand(parser: CommandParser, { username, password }: AuthOptions) {
    parser.push('AUTH');
    if (username !== undefined) {
      parser.push(username);
    }
    parser.push(password);
  },
  transformReply: undefined as unknown as () => SimpleStringReply<'OK'>
} as const satisfies Command;
