import { ValkeyCommandArgument, ValkeyCommandArguments } from ".";
import { transformPXAT } from "./generic-transformers";

export const FIRST_KEY_INDEX = 1;

export function transformArguments(
  key: ValkeyCommandArgument,
  millisecondsTimestamp: number | Date,
  mode?: "NX" | "XX" | "GT" | "LT"
): ValkeyCommandArguments {
  const args = ["PEXPIREAT", key, transformPXAT(millisecondsTimestamp)];

  if (mode) {
    args.push(mode);
  }

  return args;
}

export { transformBooleanReply as transformReply } from "./generic-transformers";
