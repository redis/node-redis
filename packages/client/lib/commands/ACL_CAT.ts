import { ValkeyCommandArgument, ValkeyCommandArguments } from ".";

export function transformArguments(
  categoryName?: ValkeyCommandArgument
): ValkeyCommandArguments {
  const args: ValkeyCommandArguments = ["ACL", "CAT"];

  if (categoryName) {
    args.push(categoryName);
  }

  return args;
}

export declare function transformReply(): Array<ValkeyCommandArgument>;
