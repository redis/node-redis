import { ValkeyCommandArgument, ValkeyCommandArguments } from ".";

export function transformArguments(
  dump: ValkeyCommandArgument,
  mode?: "FLUSH" | "APPEND" | "REPLACE"
): ValkeyCommandArguments {
  const args = ["FUNCTION", "RESTORE", dump];

  if (mode) {
    args.push(mode);
  }

  return args;
}

export declare function transformReply(): "OK";
