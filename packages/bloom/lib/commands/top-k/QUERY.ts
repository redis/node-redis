import { ValkeyCommandArguments } from "@valkey/client/dist/lib/commands";
import { pushVerdictArguments } from "@valkey/client/dist/lib/commands/generic-transformers";

export const FIRST_KEY_INDEX = 1;

export const IS_READ_ONLY = true;

export function transformArguments(
  key: string,
  items: string | Array<string>
): ValkeyCommandArguments {
  return pushVerdictArguments(["TOPK.QUERY", key], items);
}

export declare function transformReply(): Array<number>;
