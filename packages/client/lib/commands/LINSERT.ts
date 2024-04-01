import { ValkeyCommandArgument, ValkeyCommandArguments } from ".";

export const FIRST_KEY_INDEX = 1;

type LInsertPosition = "BEFORE" | "AFTER";

export function transformArguments(
  key: ValkeyCommandArgument,
  position: LInsertPosition,
  pivot: ValkeyCommandArgument,
  element: ValkeyCommandArgument
): ValkeyCommandArguments {
  return ["LINSERT", key, position, pivot, element];
}

export declare function transformReply(): number;
