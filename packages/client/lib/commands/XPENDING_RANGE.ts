import { ValkeyCommandArgument, ValkeyCommandArguments } from ".";

export const FIRST_KEY_INDEX = 1;

export const IS_READ_ONLY = true;

interface XPendingRangeOptions {
  IDLE?: number;
  consumer?: ValkeyCommandArgument;
}

export function transformArguments(
  key: ValkeyCommandArgument,
  group: ValkeyCommandArgument,
  start: string,
  end: string,
  count: number,
  options?: XPendingRangeOptions
): ValkeyCommandArguments {
  const args = ["XPENDING", key, group];

  if (options?.IDLE) {
    args.push("IDLE", options.IDLE.toString());
  }

  args.push(start, end, count.toString());

  if (options?.consumer) {
    args.push(options.consumer);
  }

  return args;
}

type XPendingRangeRawReply = Array<
  [
    id: ValkeyCommandArgument,
    consumer: ValkeyCommandArgument,
    millisecondsSinceLastDelivery: number,
    deliveriesCounter: number
  ]
>;

type XPendingRangeReply = Array<{
  id: ValkeyCommandArgument;
  owner: ValkeyCommandArgument;
  millisecondsSinceLastDelivery: number;
  deliveriesCounter: number;
}>;

export function transformReply(
  reply: XPendingRangeRawReply
): XPendingRangeReply {
  return reply.map(
    ([id, owner, millisecondsSinceLastDelivery, deliveriesCounter]) => ({
      id,
      owner,
      millisecondsSinceLastDelivery,
      deliveriesCounter,
    })
  );
}
