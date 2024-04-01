import { ValkeyCommandArgument, ValkeyCommandArguments } from ".";

export const FIRST_KEY_INDEX = 1;

export function transformArguments(
  key: ValkeyCommandArgument,
  seconds: number,
  mode?: "NX" | "XX" | "GT" | "LT"
): ValkeyCommandArguments {
  const args = ["EXPIRE", key, seconds.toString()];

  if (mode) {
    args.push(mode);
  }

  return args;
}

export { transformBooleanReply as transformReply } from "./generic-transformers";
