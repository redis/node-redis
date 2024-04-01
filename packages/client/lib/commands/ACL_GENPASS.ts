import { ValkeyCommandArgument, ValkeyCommandArguments } from ".";

export function transformArguments(bits?: number): ValkeyCommandArguments {
  const args = ["ACL", "GENPASS"];

  if (bits) {
    args.push(bits.toString());
  }

  return args;
}

export declare function transformReply(): ValkeyCommandArgument;
