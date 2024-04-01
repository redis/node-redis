import { ValkeyCommandArgument, ValkeyCommandArguments } from ".";
import { transformArguments as transformSRandMemberArguments } from "./SRANDMEMBER";

export { FIRST_KEY_INDEX } from "./SRANDMEMBER";

export function transformArguments(
  key: ValkeyCommandArgument,
  count: number
): ValkeyCommandArguments {
  return [...transformSRandMemberArguments(key), count.toString()];
}

export declare function transformReply(): Array<ValkeyCommandArgument>;
