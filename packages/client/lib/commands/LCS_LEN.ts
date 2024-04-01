import { ValkeyCommandArgument, ValkeyCommandArguments } from ".";
import { transformArguments as transformLcsArguments } from "./LCS";

export { FIRST_KEY_INDEX, IS_READ_ONLY } from "./LCS";

export function transformArguments(
  key1: ValkeyCommandArgument,
  key2: ValkeyCommandArgument
): ValkeyCommandArguments {
  const args = transformLcsArguments(key1, key2);
  args.push("LEN");
  return args;
}

export declare function transformReply(): number;
