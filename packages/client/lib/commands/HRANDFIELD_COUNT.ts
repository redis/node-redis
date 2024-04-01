import { ValkeyCommandArgument, ValkeyCommandArguments } from ".";
import { transformArguments as transformHRandFieldArguments } from "./HRANDFIELD";

export { FIRST_KEY_INDEX, IS_READ_ONLY } from "./HRANDFIELD";

export function transformArguments(
  key: ValkeyCommandArgument,
  count: number
): ValkeyCommandArguments {
  return [...transformHRandFieldArguments(key), count.toString()];
}

export declare function transformReply(): Array<ValkeyCommandArgument>;
