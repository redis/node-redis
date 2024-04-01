import {
  ValkeyCommandArgument,
  ValkeyCommandArguments,
} from "@valkey/client/dist/lib/commands";
import { pushVerdictArgument } from "@valkey/client/dist/lib/commands/generic-transformers";
import { CompressionOption, pushCompressionArgument } from ".";

export const FIRST_KEY_INDEX = 1;

interface MergeOptions extends CompressionOption {
  OVERRIDE?: boolean;
}

export function transformArguments(
  destKey: ValkeyCommandArgument,
  srcKeys: ValkeyCommandArgument | Array<ValkeyCommandArgument>,
  options?: MergeOptions
): ValkeyCommandArguments {
  const args = pushVerdictArgument(["TDIGEST.MERGE", destKey], srcKeys);

  pushCompressionArgument(args, options);

  if (options?.OVERRIDE) {
    args.push("OVERRIDE");
  }

  return args;
}

export declare function transformReply(): "OK";
