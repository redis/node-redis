import { ValkeyCommandArgument, ValkeyCommandArguments } from ".";

export const FIRST_KEY_INDEX = 1;

export function transformArguments(
  source: ValkeyCommandArgument,
  destination: ValkeyCommandArgument,
  member: ValkeyCommandArgument
): ValkeyCommandArguments {
  return ["SMOVE", source, destination, member];
}

export { transformBooleanReply as transformReply } from "./generic-transformers";
