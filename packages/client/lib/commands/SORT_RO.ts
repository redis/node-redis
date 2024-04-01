import { ValkeyCommandArguments } from ".";
import { pushSortArguments, SortOptions } from "./generic-transformers";

export const FIRST_KEY_INDEX = 1;

export const IS_READ_ONLY = true;

export function transformArguments(
  key: string,
  options?: SortOptions
): ValkeyCommandArguments {
  return pushSortArguments(["SORT_RO", key], options);
}

export declare function transformReply(): Array<string>;
