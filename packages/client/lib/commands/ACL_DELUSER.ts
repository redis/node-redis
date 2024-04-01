import { ValkeyCommandArgument, ValkeyCommandArguments } from ".";
import { pushVerdictArguments } from "./generic-transformers";

export function transformArguments(
  username: ValkeyCommandArgument | Array<ValkeyCommandArgument>
): ValkeyCommandArguments {
  return pushVerdictArguments(["ACL", "DELUSER"], username);
}

export declare function transformReply(): number;
