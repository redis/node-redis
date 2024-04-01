import { ValkeyCommandArguments } from "@valkey/client/dist/lib/commands";
import { InsertOptions, pushInsertOptions } from ".";

export const FIRST_KEY_INDEX = 1;

export function transformArguments(
  key: string,
  items: string | Array<string>,
  options?: InsertOptions
): ValkeyCommandArguments {
  return pushInsertOptions(["CF.INSERTNX", key], items, options);
}

export { transformBooleanArrayReply as transformReply } from "@valkey/client/dist/lib/commands/generic-transformers";
