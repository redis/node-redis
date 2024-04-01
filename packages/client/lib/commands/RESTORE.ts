import { ValkeyCommandArgument, ValkeyCommandArguments } from ".";

export const FIRST_KEY_INDEX = 1;

interface RestoreOptions {
  REPLACE?: true;
  ABSTTL?: true;
  IDLETIME?: number;
  FREQ?: number;
}

export function transformArguments(
  key: ValkeyCommandArgument,
  ttl: number,
  serializedValue: ValkeyCommandArgument,
  options?: RestoreOptions
): ValkeyCommandArguments {
  const args = ["RESTORE", key, ttl.toString(), serializedValue];

  if (options?.REPLACE) {
    args.push("REPLACE");
  }

  if (options?.ABSTTL) {
    args.push("ABSTTL");
  }

  if (options?.IDLETIME) {
    args.push("IDLETIME", options.IDLETIME.toString());
  }

  if (options?.FREQ) {
    args.push("FREQ", options.FREQ.toString());
  }

  return args;
}

export declare function transformReply(): "OK";
