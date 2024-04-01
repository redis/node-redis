import { ValkeyCommandArgument, ValkeyCommandArguments } from ".";
import { transformArguments as transformXAutoClaimArguments } from "./XAUTOCLAIM";

export { FIRST_KEY_INDEX } from "./XAUTOCLAIM";

export function transformArguments(
  ...args: Parameters<typeof transformXAutoClaimArguments>
): ValkeyCommandArguments {
  return [...transformXAutoClaimArguments(...args), "JUSTID"];
}

type XAutoClaimJustIdRawReply = [
  ValkeyCommandArgument,
  Array<ValkeyCommandArgument>
];

interface XAutoClaimJustIdReply {
  nextId: ValkeyCommandArgument;
  messages: Array<ValkeyCommandArgument>;
}

export function transformReply(
  reply: XAutoClaimJustIdRawReply
): XAutoClaimJustIdReply {
  return {
    nextId: reply[0],
    messages: reply[1],
  };
}
