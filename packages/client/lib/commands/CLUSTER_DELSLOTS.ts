import { ValkeyCommandArguments } from ".";
import { pushVerdictNumberArguments } from "./generic-transformers";

export function transformArguments(
  slots: number | Array<number>
): ValkeyCommandArguments {
  return pushVerdictNumberArguments(["CLUSTER", "DELSLOTS"], slots);
}

export declare function transformReply(): "OK";
