import { ValkeyCommandArgument, ValkeyCommandArguments } from ".";

export interface AuthOptions {
  username?: ValkeyCommandArgument;
  password: ValkeyCommandArgument;
}

export function transformArguments({
  username,
  password,
}: AuthOptions): ValkeyCommandArguments {
  if (!username) {
    return ["AUTH", password];
  }

  return ["AUTH", username, password];
}

export declare function transformReply(): ValkeyCommandArgument;
