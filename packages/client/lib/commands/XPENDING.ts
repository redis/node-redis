import { ValkeyCommandArgument, ValkeyCommandArguments } from ".";

export const FIRST_KEY_INDEX = 1;

export const IS_READ_ONLY = true;

export function transformArguments(
  key: ValkeyCommandArgument,
  group: ValkeyCommandArgument
): ValkeyCommandArguments {
  return ["XPENDING", key, group];
}

type XPendingRawReply = [
  pending: number,
  firstId: ValkeyCommandArgument | null,
  lastId: ValkeyCommandArgument | null,
  consumers: Array<
    [name: ValkeyCommandArgument, deliveriesCounter: ValkeyCommandArgument]
  > | null
];

interface XPendingReply {
  pending: number;
  firstId: ValkeyCommandArgument | null;
  lastId: ValkeyCommandArgument | null;
  consumers: Array<{
    name: ValkeyCommandArgument;
    deliveriesCounter: number;
  }> | null;
}

export function transformReply(reply: XPendingRawReply): XPendingReply {
  return {
    pending: reply[0],
    firstId: reply[1],
    lastId: reply[2],
    consumers:
      reply[3] === null
        ? null
        : reply[3].map(([name, deliveriesCounter]) => ({
            name,
            deliveriesCounter: Number(deliveriesCounter),
          })),
  };
}
