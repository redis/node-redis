import { ValkeyCommandArgument, ValkeyCommandArguments } from ".";
import { pushVerdictArguments } from "./generic-transformers";

export const FIRST_KEY_INDEX = 1;

export function transformArguments(
  keys: ValkeyCommandArgument | Array<ValkeyCommandArgument>,
  timeout: number
): ValkeyCommandArguments {
  const args = pushVerdictArguments(["BLPOP"], keys);

  args.push(timeout.toString());

  return args;
}

type BLPopRawReply = null | [ValkeyCommandArgument, ValkeyCommandArgument];

type BLPopReply = null | {
  key: ValkeyCommandArgument;
  element: ValkeyCommandArgument;
};

export function transformReply(reply: BLPopRawReply): BLPopReply {
  if (reply === null) return null;

  return {
    key: reply[0],
    element: reply[1],
  };
}
