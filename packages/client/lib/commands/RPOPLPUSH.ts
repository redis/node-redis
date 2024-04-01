import { ValkeyCommandArgument, ValkeyCommandArguments } from ".";

export const FIRST_KEY_INDEX = 1;

export function transformArguments(
  source: ValkeyCommandArgument,
  destination: ValkeyCommandArgument
): ValkeyCommandArguments {
  return ["RPOPLPUSH", source, destination];
}

export declare function transformReply(): ValkeyCommandArgument | null;
