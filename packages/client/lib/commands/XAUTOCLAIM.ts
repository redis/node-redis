import { ValkeyCommandArgument, ValkeyCommandArguments } from ".";
import {
  StreamMessagesNullReply,
  transformStreamMessagesNullReply,
} from "./generic-transformers";

export const FIRST_KEY_INDEX = 1;

export interface XAutoClaimOptions {
  COUNT?: number;
}

export function transformArguments(
  key: ValkeyCommandArgument,
  group: ValkeyCommandArgument,
  consumer: ValkeyCommandArgument,
  minIdleTime: number,
  start: string,
  options?: XAutoClaimOptions
): ValkeyCommandArguments {
  const args = [
    "XAUTOCLAIM",
    key,
    group,
    consumer,
    minIdleTime.toString(),
    start,
  ];

  if (options?.COUNT) {
    args.push("COUNT", options.COUNT.toString());
  }

  return args;
}

type XAutoClaimRawReply = [ValkeyCommandArgument, Array<any>];

interface XAutoClaimReply {
  nextId: ValkeyCommandArgument;
  messages: StreamMessagesNullReply;
}

export function transformReply(reply: XAutoClaimRawReply): XAutoClaimReply {
  return {
    nextId: reply[0],
    messages: transformStreamMessagesNullReply(reply[1]),
  };
}
