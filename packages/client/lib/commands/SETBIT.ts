import { ValkeyCommandArgument, ValkeyCommandArguments } from ".";
import { BitValue } from "./generic-transformers";

export const FIRST_KEY_INDEX = 1;

export function transformArguments(
  key: ValkeyCommandArgument,
  offset: number,
  value: BitValue
): ValkeyCommandArguments {
  return ["SETBIT", key, offset.toString(), value.toString()];
}

export declare function transformReply(): BitValue;
