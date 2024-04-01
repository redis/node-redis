import { ValkeyCommandArguments } from ".";
import { transformArguments as transformZUnionArguments } from "./ZUNION";

export { FIRST_KEY_INDEX, IS_READ_ONLY } from "./ZUNION";

export function transformArguments(
  ...args: Parameters<typeof transformZUnionArguments>
): ValkeyCommandArguments {
  return [...transformZUnionArguments(...args), "WITHSCORES"];
}

export { transformSortedSetWithScoresReply as transformReply } from "./generic-transformers";
