import { ValkeyCommandArguments } from ".";
import {
  CommandRawReply,
  CommandReply,
  transformCommandReply,
} from "./generic-transformers";

export const IS_READ_ONLY = true;

export function transformArguments(): ValkeyCommandArguments {
  return ["COMMAND"];
}

export function transformReply(
  reply: Array<CommandRawReply>
): Array<CommandReply> {
  return reply.map(transformCommandReply);
}
