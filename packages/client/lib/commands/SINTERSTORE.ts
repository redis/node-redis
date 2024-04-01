import { ValkeyCommandArgument, ValkeyCommandArguments } from ".";
import { pushVerdictArguments } from "./generic-transformers";

export const FIRST_KEY_INDEX = 1;

export function transformArguments(
  destination: ValkeyCommandArgument,
  keys: ValkeyCommandArgument | Array<ValkeyCommandArgument>
): ValkeyCommandArguments {
  return pushVerdictArguments(["SINTERSTORE", destination], keys);
}

export declare function transformReply(): Array<ValkeyCommandArgument>;
