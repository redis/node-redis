import { ValkeyCommandArgument, ValkeyCommandArguments } from ".";

export function transformArguments(): ValkeyCommandArguments {
  return ["FUNCTION", "DUMP"];
}

export declare function transformReply(): ValkeyCommandArgument;
