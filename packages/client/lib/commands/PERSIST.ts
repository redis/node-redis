import { ValkeyCommandArgument, ValkeyCommandArguments } from ".";

export const FIRST_KEY_INDEX = 1;

export function transformArguments(
  key: ValkeyCommandArgument
): ValkeyCommandArguments {
  return ["PERSIST", key];
}

export { transformBooleanReply as transformReply } from "./generic-transformers";
