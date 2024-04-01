import { ValkeyCommandArguments } from ".";
import { pushVerdictNumberArguments } from "./generic-transformers";

export function transformArguments(
  slots: number | Array<number>
): ValkeyCommandArguments {
  return pushVerdictNumberArguments(["CLUSTER", "ADDSLOTS"], slots);
}

export declare function transformReply(): string;
