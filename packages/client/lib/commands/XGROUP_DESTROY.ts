import { ValkeyCommandArgument, ValkeyCommandArguments } from ".";

export const FIRST_KEY_INDEX = 2;

export function transformArguments(
  key: ValkeyCommandArgument,
  group: ValkeyCommandArgument
): ValkeyCommandArguments {
  return ["XGROUP", "DESTROY", key, group];
}

export { transformBooleanReply as transformReply } from "./generic-transformers";
