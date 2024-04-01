import { ValkeyCommandArguments } from "@valkey/client/dist/lib/commands";
import { IncrDecrOptions, transformIncrDecrArguments } from ".";

export const FIRST_KEY_INDEX = 1;

export function transformArguments(
  key: string,
  value: number,
  options?: IncrDecrOptions
): ValkeyCommandArguments {
  return transformIncrDecrArguments("TS.INCRBY", key, value, options);
}

export declare function transformReply(): number;
