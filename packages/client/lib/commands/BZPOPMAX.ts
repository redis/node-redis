import { ValkeyCommandArgument, ValkeyCommandArguments } from ".";
import {
  pushVerdictArguments,
  transformNumberInfinityReply,
  ZMember,
} from "./generic-transformers";

export const FIRST_KEY_INDEX = 1;

export function transformArguments(
  key: ValkeyCommandArgument | Array<ValkeyCommandArgument>,
  timeout: number
): ValkeyCommandArguments {
  const args = pushVerdictArguments(["BZPOPMAX"], key);

  args.push(timeout.toString());

  return args;
}

type ZMemberRawReply =
  | [
      key: ValkeyCommandArgument,
      value: ValkeyCommandArgument,
      score: ValkeyCommandArgument
    ]
  | null;

type BZPopMaxReply = (ZMember & { key: ValkeyCommandArgument }) | null;

export function transformReply(reply: ZMemberRawReply): BZPopMaxReply | null {
  if (!reply) return null;

  return {
    key: reply[0],
    value: reply[1],
    score: transformNumberInfinityReply(reply[2]),
  };
}
