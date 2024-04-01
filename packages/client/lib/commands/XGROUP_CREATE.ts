import { ValkeyCommandArgument, ValkeyCommandArguments } from ".";

export const FIRST_KEY_INDEX = 2;

interface XGroupCreateOptions {
  MKSTREAM?: true;
}

export function transformArguments(
  key: ValkeyCommandArgument,
  group: ValkeyCommandArgument,
  id: ValkeyCommandArgument,
  options?: XGroupCreateOptions
): ValkeyCommandArguments {
  const args = ["XGROUP", "CREATE", key, group, id];

  if (options?.MKSTREAM) {
    args.push("MKSTREAM");
  }

  return args;
}

export declare function transformReply(): ValkeyCommandArgument;
