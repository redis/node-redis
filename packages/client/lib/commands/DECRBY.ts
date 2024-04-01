import { ValkeyCommandArgument, ValkeyCommandArguments } from ".";

export const FIRST_KEY_INDEX = 1;

export function transformArguments(
  key: ValkeyCommandArgument,
  decrement: number
): ValkeyCommandArguments {
  return ["DECRBY", key, decrement.toString()];
}

export declare function transformReply(): number;
