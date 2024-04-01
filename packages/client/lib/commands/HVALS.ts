import { ValkeyCommandArgument, ValkeyCommandArguments } from ".";

export const FIRST_KEY_INDEX = 1;

export function transformArguments(
  key: ValkeyCommandArgument
): ValkeyCommandArguments {
  return ["HVALS", key];
}

export declare function transformReply(): Array<ValkeyCommandArgument>;
