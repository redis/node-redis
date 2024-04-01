import { ValkeyCommandArgument, ValkeyCommandArguments } from ".";

export const FIRST_KEY_INDEX = 1;

export function transformArguments(
  key: ValkeyCommandArgument,
  count: number
): ValkeyCommandArguments {
  return ["LPOP", key, count.toString()];
}

export declare function transformReply(): Array<ValkeyCommandArgument> | null;
