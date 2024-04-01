import { ValkeyCommandArgument, ValkeyCommandArguments } from ".";

export const FIRST_KEY_INDEX = 2;

export const IS_READ_ONLY = true;

export function transformArguments(
  key: ValkeyCommandArgument
): ValkeyCommandArguments {
  return ["XINFO", "GROUPS", key];
}

type XInfoGroupsReply = Array<{
  name: ValkeyCommandArgument;
  consumers: number;
  pending: number;
  lastDeliveredId: ValkeyCommandArgument;
}>;

export function transformReply(rawReply: Array<any>): XInfoGroupsReply {
  return rawReply.map((group) => ({
    name: group[1],
    consumers: group[3],
    pending: group[5],
    lastDeliveredId: group[7],
  }));
}
