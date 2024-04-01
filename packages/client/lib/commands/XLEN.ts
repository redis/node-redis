import { ValkeyCommandArgument, ValkeyCommandArguments } from ".";

export const FIRST_KEY_INDEX = 1;

export const IS_READ_ONLY = true;

export function transformArguments(
  key: ValkeyCommandArgument
): ValkeyCommandArguments {
  return ["XLEN", key];
}

export declare function transformReply(): number;
