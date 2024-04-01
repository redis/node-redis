import { ValkeyCommandArgument, ValkeyCommandArguments } from ".";

export const IS_READ_ONLY = true;

export function transformArguments(
  pattern?: ValkeyCommandArgument
): ValkeyCommandArguments {
  const args: ValkeyCommandArguments = ["PUBSUB", "SHARDCHANNELS"];
  if (pattern) args.push(pattern);
  return args;
}

export declare function transformReply(): Array<ValkeyCommandArgument>;
