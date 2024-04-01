import { ValkeyCommandArguments } from ".";
import {
  FunctionListItemReply,
  FunctionListRawItemReply,
  transformFunctionListItemReply,
} from "./generic-transformers";

export function transformArguments(pattern?: string): ValkeyCommandArguments {
  const args = ["FUNCTION", "LIST"];

  if (pattern) {
    args.push(pattern);
  }

  return args;
}

export function transformReply(
  reply: Array<FunctionListRawItemReply>
): Array<FunctionListItemReply> {
  return reply.map(transformFunctionListItemReply);
}
