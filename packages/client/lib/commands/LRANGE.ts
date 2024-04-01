import { ValkeyCommandArgument, ValkeyCommandArguments } from ".";

export const FIRST_KEY_INDEX = 1;

export const IS_READ_ONLY = true;

export function transformArguments(
  key: ValkeyCommandArgument,
  start: number,
  stop: number
): ValkeyCommandArguments {
  return ["LRANGE", key, start.toString(), stop.toString()];
}

export declare function transformReply(): Array<ValkeyCommandArgument>;
