import { ValkeyCommandArguments } from "@valkey/client/dist/lib/commands";
import { pushVerdictArguments } from "@valkey/client/dist/lib/commands/generic-transformers";

export function transformArguments(
  dictionary: string,
  term: string | Array<string>
): ValkeyCommandArguments {
  return pushVerdictArguments(["FT.DICTDEL", dictionary], term);
}

export declare function transformReply(): number;
