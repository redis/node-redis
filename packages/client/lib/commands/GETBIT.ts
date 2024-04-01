import { ValkeyCommandArgument, ValkeyCommandArguments } from ".";
import { BitValue } from "./generic-transformers";

export const FIRST_KEY_INDEX = 1;

export const IS_READ_ONLY = true;

export function transformArguments(
  key: ValkeyCommandArgument,
  offset: number
): ValkeyCommandArguments {
  return ["GETBIT", key, offset.toString()];
}

export declare function transformReply(): BitValue;
