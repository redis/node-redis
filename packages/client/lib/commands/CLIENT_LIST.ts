import { ValkeyCommandArguments, ValkeyCommandArgument } from ".";
import { pushVerdictArguments } from "./generic-transformers";
import {
  transformReply as transformClientInfoReply,
  ClientInfoReply,
} from "./CLIENT_INFO";

interface ListFilterType {
  TYPE: "NORMAL" | "MASTER" | "REPLICA" | "PUBSUB";
  ID?: never;
}

interface ListFilterId {
  ID: Array<ValkeyCommandArgument>;
  TYPE?: never;
}

export type ListFilter = ListFilterType | ListFilterId;

export const IS_READ_ONLY = true;

export function transformArguments(
  filter?: ListFilter
): ValkeyCommandArguments {
  let args: ValkeyCommandArguments = ["CLIENT", "LIST"];

  if (filter) {
    if (filter.TYPE !== undefined) {
      args.push("TYPE", filter.TYPE);
    } else {
      args.push("ID");
      args = pushVerdictArguments(args, filter.ID);
    }
  }

  return args;
}

export function transformReply(rawReply: string): Array<ClientInfoReply> {
  const split = rawReply.split("\n"),
    length = split.length - 1,
    reply: Array<ClientInfoReply> = [];
  for (let i = 0; i < length; i++) {
    reply.push(transformClientInfoReply(split[i]));
  }

  return reply;
}
