import { ValkeyCommandArgument, ValkeyCommandArguments } from ".";

export const FIRST_KEY_INDEX = 1;

export const IS_READ_ONLY = true;

export function transformArguments(
  key: ValkeyCommandArgument,
  start: number,
  end: number
): ValkeyCommandArguments {
  return ["GETRANGE", key, start.toString(), end.toString()];
}

export declare function transformReply(): ValkeyCommandArgument;
