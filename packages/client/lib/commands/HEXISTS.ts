import { ValkeyCommandArgument, ValkeyCommandArguments } from ".";

export const FIRST_KEY_INDEX = 1;

export function transformArguments(
  key: ValkeyCommandArgument,
  field: ValkeyCommandArgument
): ValkeyCommandArguments {
  return ["HEXISTS", key, field];
}

export { transformBooleanReply as transformReply } from "./generic-transformers";
