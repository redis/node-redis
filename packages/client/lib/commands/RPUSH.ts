import { ValkeyCommandArgument, ValkeyCommandArguments } from ".";
import { pushVerdictArguments } from "./generic-transformers";

export const FIRST_KEY_INDEX = 1;

export function transformArguments(
  key: ValkeyCommandArgument,
  element: ValkeyCommandArgument | Array<ValkeyCommandArgument>
): ValkeyCommandArguments {
  return pushVerdictArguments(["RPUSH", key], element);
}

export declare function transformReply(): number;
