import { ValkeyCommandArgument, ValkeyCommandArguments } from ".";

export const FIRST_KEY_INDEX = 1;

export function transformArguments(
  key: ValkeyCommandArgument,
  seconds: number,
  value: ValkeyCommandArgument
): ValkeyCommandArguments {
  return ["SETEX", key, seconds.toString(), value];
}

export declare function transformReply(): ValkeyCommandArgument;
