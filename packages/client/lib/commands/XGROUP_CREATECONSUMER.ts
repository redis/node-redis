import { ValkeyCommandArgument, ValkeyCommandArguments } from ".";

export const FIRST_KEY_INDEX = 2;

export function transformArguments(
  key: ValkeyCommandArgument,
  group: ValkeyCommandArgument,
  consumer: ValkeyCommandArgument
): ValkeyCommandArguments {
  return ["XGROUP", "CREATECONSUMER", key, group, consumer];
}

export { transformBooleanReply as transformReply } from "./generic-transformers";
