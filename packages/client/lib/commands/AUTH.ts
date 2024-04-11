import { RedisArgument, SimpleStringReply, Command } from '../RESP/types';

export interface AuthOptions {
  username?: RedisArgument;
  password: RedisArgument;
}

export default {
  FIRST_KEY_INDEX: undefined,
  IS_READ_ONLY: true,
  transformArguments({ username, password }: AuthOptions) {
    const args: Array<RedisArgument> = ['AUTH'];

    if (username !== undefined) {
      args.push(username);
    }

    args.push(password);

    return args;
  },
  transformReply: undefined as unknown as () => SimpleStringReply<'OK'>
} as const satisfies Command;
