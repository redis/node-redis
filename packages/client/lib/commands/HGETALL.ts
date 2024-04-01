import { ValkeyCommandArgument, ValkeyCommandArguments } from ".";

export const FIRST_KEY_INDEX = 1;

export const IS_READ_ONLY = true;

export const TRANSFORM_LEGACY_REPLY = true;

export function transformArguments(
  key: ValkeyCommandArgument
): ValkeyCommandArguments {
  return ["HGETALL", key];
}

export { transformTuplesReply as transformReply } from "./generic-transformers";
