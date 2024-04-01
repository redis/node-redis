import { ValkeyCommandArgument, ValkeyCommandArguments } from ".";

interface BgSaveOptions {
  SCHEDULE?: true;
}

export function transformArguments(
  options?: BgSaveOptions
): ValkeyCommandArguments {
  const args = ["BGSAVE"];

  if (options?.SCHEDULE) {
    args.push("SCHEDULE");
  }

  return args;
}

export declare function transformReply(): ValkeyCommandArgument;
