import { ValkeyCommandArgument, ValkeyCommandArguments } from ".";

export const FIRST_KEY_INDEX = 1;

export function transformArguments(
  key: ValkeyCommandArgument,
  field: ValkeyCommandArgument
): ValkeyCommandArguments {
  return ["HSTRLEN", key, field];
}

export declare function transformReply(): number;
