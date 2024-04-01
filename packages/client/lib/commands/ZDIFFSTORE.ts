import { ValkeyCommandArgument, ValkeyCommandArguments } from ".";
import { pushVerdictArgument } from "./generic-transformers";

export const FIRST_KEY_INDEX = 1;

export function transformArguments(
  destination: ValkeyCommandArgument,
  keys: Array<ValkeyCommandArgument> | ValkeyCommandArgument
): ValkeyCommandArguments {
  return pushVerdictArgument(["ZDIFFSTORE", destination], keys);
}

export declare function transformReply(): number;
