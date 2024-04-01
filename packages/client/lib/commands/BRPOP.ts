import { ValkeyCommandArgument, ValkeyCommandArguments } from ".";
import { pushVerdictArguments } from "./generic-transformers";

export const FIRST_KEY_INDEX = 1;

export function transformArguments(
  key: ValkeyCommandArgument | Array<ValkeyCommandArgument>,
  timeout: number
): ValkeyCommandArguments {
  const args = pushVerdictArguments(["BRPOP"], key);

  args.push(timeout.toString());

  return args;
}

export { transformReply } from "./BLPOP";
