import { ValkeyCommandArgument, ValkeyCommandArguments } from ".";

export const FIRST_KEY_INDEX = 1;

export function transformArguments(
  key: ValkeyCommandArgument,
  member: ValkeyCommandArgument
): ValkeyCommandArguments {
  return ["SISMEMBER", key, member];
}

export { transformBooleanReply as transformReply } from "./generic-transformers";
