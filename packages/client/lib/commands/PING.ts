import { ValkeyCommandArgument, ValkeyCommandArguments } from ".";

export function transformArguments(
  message?: ValkeyCommandArgument
): ValkeyCommandArguments {
  const args: ValkeyCommandArguments = ["PING"];
  if (message) {
    args.push(message);
  }

  return args;
}

export declare function transformReply(): ValkeyCommandArgument;
