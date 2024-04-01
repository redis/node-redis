import { ValkeyCommandArgument, ValkeyCommandArguments } from ".";

export const FIRST_KEY_INDEX = 1;

export function transformArguments(
  key: ValkeyCommandArgument,
  members: Array<ValkeyCommandArgument>
): ValkeyCommandArguments {
  return ["SMISMEMBER", key, ...members];
}

export { transformBooleanArrayReply as transformReply } from "./generic-transformers";
