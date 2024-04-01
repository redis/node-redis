import { ValkeyCommandArgument, ValkeyCommandArguments } from ".";

export const IS_READ_ONLY = true;

export function transformArguments(
  channel: ValkeyCommandArgument,
  message: ValkeyCommandArgument
): ValkeyCommandArguments {
  return ["PUBLISH", channel, message];
}

export declare function transformReply(): number;
