import { ValkeyCommandArguments } from ".";

export function transformArguments(): ValkeyCommandArguments {
  return ["CLIENT", "GETNAME"];
}

export declare function transformReply(): string | null;
