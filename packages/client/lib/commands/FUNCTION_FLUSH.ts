import { ValkeyCommandArguments } from ".";

export function transformArguments(
  mode?: "ASYNC" | "SYNC"
): ValkeyCommandArguments {
  const args = ["FUNCTION", "FLUSH"];

  if (mode) {
    args.push(mode);
  }

  return args;
}

export declare function transformReply(): "OK";
