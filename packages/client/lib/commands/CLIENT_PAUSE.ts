import { ValkeyCommandArguments } from ".";

export function transformArguments(
  timeout: number,
  mode?: "WRITE" | "ALL"
): ValkeyCommandArguments {
  const args = ["CLIENT", "PAUSE", timeout.toString()];

  if (mode) {
    args.push(mode);
  }

  return args;
}

export declare function transformReply(): "OK" | Buffer;
