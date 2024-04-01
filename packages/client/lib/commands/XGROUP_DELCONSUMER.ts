import { ValkeyCommandArgument, ValkeyCommandArguments } from ".";

export const FIRST_KEY_INDEX = 2;

export function transformArguments(
  key: ValkeyCommandArgument,
  group: ValkeyCommandArgument,
  consumer: ValkeyCommandArgument
): ValkeyCommandArguments {
  return ["XGROUP", "DELCONSUMER", key, group, consumer];
}

export declare function transformReply(): number;
