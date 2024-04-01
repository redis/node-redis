import { ValkeyCommandArgument, ValkeyCommandArguments } from ".";

export const FIRST_KEY_INDEX = 1;

export function transformArguments(
  key: ValkeyCommandArgument,
  start: number,
  stop: number
): ValkeyCommandArguments {
  return ["LTRIM", key, start.toString(), stop.toString()];
}

export declare function transformReply(): ValkeyCommandArgument;
