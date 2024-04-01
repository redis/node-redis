import { pushVerdictArguments } from "@valkey/client/dist/lib/commands/generic-transformers";
import { ValkeyCommandArguments } from "@valkey/client/dist/lib/commands";

interface SynUpdateOptions {
  SKIPINITIALSCAN?: true;
}

export function transformArguments(
  index: string,
  groupId: string,
  terms: string | Array<string>,
  options?: SynUpdateOptions
): ValkeyCommandArguments {
  const args = ["FT.SYNUPDATE", index, groupId];

  if (options?.SKIPINITIALSCAN) {
    args.push("SKIPINITIALSCAN");
  }

  return pushVerdictArguments(args, terms);
}

export declare function transformReply(): "OK";
