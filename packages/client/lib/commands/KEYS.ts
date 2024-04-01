import { ValkeyCommandArgument, ValkeyCommandArguments } from ".";

export function transformArguments(
  pattern: ValkeyCommandArgument
): ValkeyCommandArguments {
  return ["KEYS", pattern];
}

export declare function transformReply(): Array<ValkeyCommandArgument>;
