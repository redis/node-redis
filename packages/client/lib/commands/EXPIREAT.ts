import { ValkeyCommandArgument, ValkeyCommandArguments } from ".";
import { transformEXAT } from "./generic-transformers";

export const FIRST_KEY_INDEX = 1;

export function transformArguments(
  key: ValkeyCommandArgument,
  timestamp: number | Date,
  mode?: "NX" | "XX" | "GT" | "LT"
): ValkeyCommandArguments {
  const args = ["EXPIREAT", key, transformEXAT(timestamp)];

  if (mode) {
    args.push(mode);
  }

  return args;
}

export { transformBooleanReply as transformReply } from "./generic-transformers";
