import { ValkeyCommandArgument, ValkeyCommandArguments } from ".";

export const FIRST_KEY_INDEX = 1;

export function transformArguments(
  key: ValkeyCommandArgument,
  newKey: ValkeyCommandArgument
): ValkeyCommandArguments {
  return ["RENAMENX", key, newKey];
}

export { transformBooleanReply as transformReply } from "./generic-transformers";
