import { ValkeyCommandArgument, ValkeyCommandArguments } from ".";
import { pushVerdictArguments } from "./generic-transformers";

export const FIRST_KEY_INDEX = 1;

export function transformArguments(
  key: ValkeyCommandArgument,
  members: ValkeyCommandArgument | Array<ValkeyCommandArgument>
): ValkeyCommandArguments {
  return pushVerdictArguments(["SREM", key], members);
}

export declare function transformReply(): number;
