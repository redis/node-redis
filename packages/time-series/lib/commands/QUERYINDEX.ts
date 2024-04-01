import { ValkeyCommandArguments } from "@valkey/client/dist/lib/commands";
import { pushVerdictArguments } from "@valkey/client/dist/lib/commands/generic-transformers";
import { Filter } from ".";

export const IS_READ_ONLY = true;

export function transformArguments(filter: Filter): ValkeyCommandArguments {
  return pushVerdictArguments(["TS.QUERYINDEX"], filter);
}

export declare function transformReply(): Array<string>;
