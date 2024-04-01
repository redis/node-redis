import { ValkeyCommandArgument, ValkeyCommandArguments } from ".";

export const FIRST_KEY_INDEX = 2;

export function transformArguments(
  key: ValkeyCommandArgument,
  group: ValkeyCommandArgument,
  id: ValkeyCommandArgument
): ValkeyCommandArguments {
  return ["XGROUP", "SETID", key, group, id];
}

export declare function transformReply(): ValkeyCommandArgument;
