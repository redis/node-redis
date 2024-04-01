import { ValkeyCommandArgument, ValkeyCommandArguments } from ".";

export const FIRST_KEY_INDEX = 1;

export function transformArguments(
  key: ValkeyCommandArgument
): ValkeyCommandArguments {
  return ["ZPOPMAX", key];
}

export { transformSortedSetMemberNullReply as transformReply } from "./generic-transformers";
