import { ValkeyCommandArgument, ValkeyCommandArguments } from ".";

export const FIRST_KEY_INDEX = 1;

export function transformArguments(
  key: ValkeyCommandArgument,
  field: ValkeyCommandArgument,
  value: ValkeyCommandArgument
): ValkeyCommandArguments {
  return ["HSETNX", key, field, value];
}

export { transformBooleanReply as transformReply } from "./generic-transformers";
