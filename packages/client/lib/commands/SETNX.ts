import { ValkeyCommandArgument, ValkeyCommandArguments } from ".";

export const FIRST_KEY_INDEX = 1;

export function transformArguments(
  key: ValkeyCommandArgument,
  value: ValkeyCommandArgument
): ValkeyCommandArguments {
  return ["SETNX", key, value];
}

export { transformBooleanReply as transformReply } from "./generic-transformers";
