import { ValkeyCommandArgument, ValkeyCommandArguments } from ".";

export const IS_READ_ONLY = true;

export function transformArguments(): ValkeyCommandArguments {
  return ["RANDOMKEY"];
}

export declare function transformReply(): ValkeyCommandArgument | null;
