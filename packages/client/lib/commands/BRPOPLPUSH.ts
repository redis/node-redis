import { ValkeyCommandArgument, ValkeyCommandArguments } from ".";

export const FIRST_KEY_INDEX = 1;

export function transformArguments(
  source: ValkeyCommandArgument,
  destination: ValkeyCommandArgument,
  timeout: number
): ValkeyCommandArguments {
  return ["BRPOPLPUSH", source, destination, timeout.toString()];
}

export declare function transformReply(): ValkeyCommandArgument | null;
