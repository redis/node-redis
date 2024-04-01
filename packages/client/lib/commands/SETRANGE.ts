import { ValkeyCommandArgument, ValkeyCommandArguments } from ".";

export const FIRST_KEY_INDEX = 1;

export function transformArguments(
  key: ValkeyCommandArgument,
  offset: number,
  value: ValkeyCommandArgument
): ValkeyCommandArguments {
  return ["SETRANGE", key, offset.toString(), value];
}

export declare function transformReply(): number;
