import { ValkeyCommandArgument, ValkeyCommandArguments } from ".";
import { transformArguments as transformZPopMaxArguments } from "./ZPOPMAX";

export { FIRST_KEY_INDEX } from "./ZPOPMAX";

export function transformArguments(
  key: ValkeyCommandArgument,
  count: number
): ValkeyCommandArguments {
  return [...transformZPopMaxArguments(key), count.toString()];
}

export { transformSortedSetWithScoresReply as transformReply } from "./generic-transformers";
