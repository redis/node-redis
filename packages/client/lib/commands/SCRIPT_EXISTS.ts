import { ValkeyCommandArguments } from ".";
import { pushVerdictArguments } from "./generic-transformers";

export function transformArguments(
  sha1: string | Array<string>
): ValkeyCommandArguments {
  return pushVerdictArguments(["SCRIPT", "EXISTS"], sha1);
}

export { transformBooleanArrayReply as transformReply } from "./generic-transformers";
