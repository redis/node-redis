import { ValkeyCommandArguments } from ".";

export const IS_READ_ONLY = true;

export function transformArguments(): ValkeyCommandArguments {
  return ["COMMAND", "COUNT"];
}

export declare function transformReply(): number;
