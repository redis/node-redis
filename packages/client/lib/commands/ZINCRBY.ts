import { ValkeyCommandArgument, ValkeyCommandArguments } from ".";
import { transformNumberInfinityArgument } from "./generic-transformers";

export const FIRST_KEY_INDEX = 1;

export function transformArguments(
  key: ValkeyCommandArgument,
  increment: number,
  member: ValkeyCommandArgument
): ValkeyCommandArguments {
  return ["ZINCRBY", key, transformNumberInfinityArgument(increment), member];
}

export { transformNumberInfinityReply as transformReply } from "./generic-transformers";
