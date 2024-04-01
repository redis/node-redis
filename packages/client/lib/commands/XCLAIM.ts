import { ValkeyCommandArgument, ValkeyCommandArguments } from ".";
import { pushVerdictArguments } from "./generic-transformers";

export const FIRST_KEY_INDEX = 1;

export interface XClaimOptions {
  IDLE?: number;
  TIME?: number | Date;
  RETRYCOUNT?: number;
  FORCE?: true;
}

export function transformArguments(
  key: ValkeyCommandArgument,
  group: ValkeyCommandArgument,
  consumer: ValkeyCommandArgument,
  minIdleTime: number,
  id: ValkeyCommandArgument | Array<ValkeyCommandArgument>,
  options?: XClaimOptions
): ValkeyCommandArguments {
  const args = pushVerdictArguments(
    ["XCLAIM", key, group, consumer, minIdleTime.toString()],
    id
  );

  if (options?.IDLE) {
    args.push("IDLE", options.IDLE.toString());
  }

  if (options?.TIME) {
    args.push(
      "TIME",
      (typeof options.TIME === "number"
        ? options.TIME
        : options.TIME.getTime()
      ).toString()
    );
  }

  if (options?.RETRYCOUNT) {
    args.push("RETRYCOUNT", options.RETRYCOUNT.toString());
  }

  if (options?.FORCE) {
    args.push("FORCE");
  }

  return args;
}

export { transformStreamMessagesNullReply as transformReply } from "./generic-transformers";
