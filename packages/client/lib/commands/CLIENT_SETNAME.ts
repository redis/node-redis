import { ValkeyCommandArgument, ValkeyCommandArguments } from ".";

export function transformArguments(
  name: ValkeyCommandArgument
): ValkeyCommandArguments {
  return ["CLIENT", "SETNAME", name];
}

export declare function transformReply(): ValkeyCommandArgument;
