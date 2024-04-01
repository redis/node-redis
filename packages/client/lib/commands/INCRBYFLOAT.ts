import { ValkeyCommandArgument, ValkeyCommandArguments } from ".";

export const FIRST_KEY_INDEX = 1;

export function transformArguments(
  key: ValkeyCommandArgument,
  increment: number
): ValkeyCommandArguments {
  return ["INCRBYFLOAT", key, increment.toString()];
}

export declare function transformReply(): ValkeyCommandArgument;
