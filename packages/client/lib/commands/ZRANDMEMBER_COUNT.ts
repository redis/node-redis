import { ValkeyCommandArgument, ValkeyCommandArguments } from ".";
import { transformArguments as transformZRandMemberArguments } from "./ZRANDMEMBER";

export { FIRST_KEY_INDEX, IS_READ_ONLY } from "./ZRANDMEMBER";

export function transformArguments(
  key: ValkeyCommandArgument,
  count: number
): ValkeyCommandArguments {
  return [...transformZRandMemberArguments(key), count.toString()];
}

export declare function transformReply(): Array<ValkeyCommandArgument>;
