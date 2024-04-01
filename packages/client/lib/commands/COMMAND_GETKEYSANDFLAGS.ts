import { ValkeyCommandArgument, ValkeyCommandArguments } from ".";

export const IS_READ_ONLY = true;

export function transformArguments(
  args: Array<ValkeyCommandArgument>
): ValkeyCommandArguments {
  return ["COMMAND", "GETKEYSANDFLAGS", ...args];
}

type KeysAndFlagsRawReply = Array<
  [ValkeyCommandArgument, ValkeyCommandArguments]
>;

type KeysAndFlagsReply = Array<{
  key: ValkeyCommandArgument;
  flags: ValkeyCommandArguments;
}>;

export function transformReply(reply: KeysAndFlagsRawReply): KeysAndFlagsReply {
  return reply.map(([key, flags]) => ({
    key,
    flags,
  }));
}
