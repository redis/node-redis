import { ValkeyCommandArgument, ValkeyCommandArguments } from ".";
import { transformArguments as transformXClaimArguments } from "./XCLAIM";

export { FIRST_KEY_INDEX } from "./XCLAIM";

export function transformArguments(
  ...args: Parameters<typeof transformXClaimArguments>
): ValkeyCommandArguments {
  return [...transformXClaimArguments(...args), "JUSTID"];
}

export declare function transformReply(): Array<ValkeyCommandArgument>;
