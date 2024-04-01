import { ValkeyCommandArguments } from ".";
import { pushSortArguments, SortOptions } from "./generic-transformers";

export const FIRST_KEY_INDEX = 1;

export function transformArguments(
  key: string,
  options?: SortOptions
): ValkeyCommandArguments {
  return pushSortArguments(["SORT", key], options);
}

export declare function transformReply(): Array<string>;
