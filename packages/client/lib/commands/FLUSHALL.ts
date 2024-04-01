export enum ValkeyFlushModes {
  ASYNC = "ASYNC",
  SYNC = "SYNC",
}

export function transformArguments(mode?: ValkeyFlushModes): Array<string> {
  const args = ["FLUSHALL"];

  if (mode) {
    args.push(mode);
  }

  return args;
}

export declare function transformReply(): string;
