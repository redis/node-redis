import { ValkeyCommandArgument, ValkeyCommandArguments } from ".";

export const FIRST_KEY_INDEX = 1;

export function transformArguments(
  key: ValkeyCommandArgument,
  count?: number
): ValkeyCommandArguments {
  const args = ["SPOP", key];

  if (typeof count === "number") {
    args.push(count.toString());
  }

  return args;
}

export declare function transformReply(): Array<ValkeyCommandArgument>;
