import { ValkeyCommandArgument, ValkeyCommandArguments } from ".";

export const FIRST_KEY_INDEX = 1;

export function transformArguments(
  key: ValkeyCommandArgument,
  count: number,
  element: ValkeyCommandArgument
): ValkeyCommandArguments {
  return ["LREM", key, count.toString(), element];
}

export declare function transformReply(): number;
