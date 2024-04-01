import { ValkeyCommandArgument, ValkeyCommandArguments } from ".";

export const FIRST_KEY_INDEX = 1;

export function transformArguments(
  key: ValkeyCommandArgument,
  index: number,
  element: ValkeyCommandArgument
): ValkeyCommandArguments {
  return ["LSET", key, index.toString(), element];
}

export declare function transformReply(): ValkeyCommandArgument;
