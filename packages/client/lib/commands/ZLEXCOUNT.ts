import { ValkeyCommandArgument, ValkeyCommandArguments } from ".";

export const FIRST_KEY_INDEX = 1;

export const IS_READ_ONLY = true;

export function transformArguments(
  key: ValkeyCommandArgument,
  min: ValkeyCommandArgument,
  max: ValkeyCommandArgument
): ValkeyCommandArguments {
  return ["ZLEXCOUNT", key, min, max];
}

export declare function transformReply(): number;
