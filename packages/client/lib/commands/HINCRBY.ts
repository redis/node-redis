import { ValkeyCommandArgument, ValkeyCommandArguments } from ".";

export const FIRST_KEY_INDEX = 1;

export function transformArguments(
  key: ValkeyCommandArgument,
  field: ValkeyCommandArgument,
  increment: number
): ValkeyCommandArguments {
  return ["HINCRBY", key, field, increment.toString()];
}

export declare function transformReply(): number;
