import { ValkeyCommandArgument, ValkeyCommandArguments } from ".";
import { pushVerdictArgument } from "./generic-transformers";

export const FIRST_KEY_INDEX = 2;

export const IS_READ_ONLY = true;

export function transformArguments(
  keys: Array<ValkeyCommandArgument> | ValkeyCommandArgument,
  limit?: number
): ValkeyCommandArguments {
  const args = pushVerdictArgument(["ZINTERCARD"], keys);

  if (limit) {
    args.push("LIMIT", limit.toString());
  }

  return args;
}

export declare function transformReply(): number;
