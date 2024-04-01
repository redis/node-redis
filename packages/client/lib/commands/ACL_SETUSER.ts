import { ValkeyCommandArgument, ValkeyCommandArguments } from ".";
import { pushVerdictArguments } from "./generic-transformers";

export function transformArguments(
  username: ValkeyCommandArgument,
  rule: ValkeyCommandArgument | Array<ValkeyCommandArgument>
): ValkeyCommandArguments {
  return pushVerdictArguments(["ACL", "SETUSER", username], rule);
}

export declare function transformReply(): ValkeyCommandArgument;
