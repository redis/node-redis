import { ValkeyCommandArgument, ValkeyCommandArguments } from ".";

export const FIRST_KEY_INDEX = 1;

export const IS_READ_ONLY = true;

export function transformArguments(
  key: ValkeyCommandArgument,
  field: ValkeyCommandArgument
): ValkeyCommandArguments {
  return ["HGET", key, field];
}

export declare function transformReply(): ValkeyCommandArgument | undefined;
