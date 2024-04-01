import { ValkeyCommandArgument, ValkeyCommandArguments } from ".";

export const FIRST_KEY_INDEX = 1;

export function transformArguments(
  key: ValkeyCommandArgument,
  milliseconds: number,
  value: ValkeyCommandArgument
): ValkeyCommandArguments {
  return ["PSETEX", key, milliseconds.toString(), value];
}

export declare function transformReply(): ValkeyCommandArgument;
