import { ValkeyCommandArgument, ValkeyCommandArguments } from ".";
import {
  SortedSetSide,
  transformSortedSetMemberReply,
  transformZMPopArguments,
  ZMember,
  ZMPopOptions,
} from "./generic-transformers";

export const FIRST_KEY_INDEX = 2;

export function transformArguments(
  keys: ValkeyCommandArgument | Array<ValkeyCommandArgument>,
  side: SortedSetSide,
  options?: ZMPopOptions
): ValkeyCommandArguments {
  return transformZMPopArguments(["ZMPOP"], keys, side, options);
}

type ZMPopRawReply =
  | null
  | [
      key: string,
      elements: Array<[ValkeyCommandArgument, ValkeyCommandArgument]>
    ];

type ZMPopReply = null | {
  key: string;
  elements: Array<ZMember>;
};

export function transformReply(reply: ZMPopRawReply): ZMPopReply {
  return reply === null
    ? null
    : {
        key: reply[0],
        elements: reply[1].map(transformSortedSetMemberReply),
      };
}
