import { ValkeyCommandArgument, ValkeyCommandArguments } from ".";

export function transformArguments(count?: number): ValkeyCommandArguments {
  const args = ["ACL", "LOG"];

  if (count) {
    args.push(count.toString());
  }

  return args;
}

type AclLogRawReply = [
  _: ValkeyCommandArgument,
  count: number,
  _: ValkeyCommandArgument,
  reason: ValkeyCommandArgument,
  _: ValkeyCommandArgument,
  context: ValkeyCommandArgument,
  _: ValkeyCommandArgument,
  object: ValkeyCommandArgument,
  _: ValkeyCommandArgument,
  username: ValkeyCommandArgument,
  _: ValkeyCommandArgument,
  ageSeconds: ValkeyCommandArgument,
  _: ValkeyCommandArgument,
  clientInfo: ValkeyCommandArgument
];

interface AclLog {
  count: number;
  reason: ValkeyCommandArgument;
  context: ValkeyCommandArgument;
  object: ValkeyCommandArgument;
  username: ValkeyCommandArgument;
  ageSeconds: number;
  clientInfo: ValkeyCommandArgument;
}

export function transformReply(reply: Array<AclLogRawReply>): Array<AclLog> {
  return reply.map((log) => ({
    count: log[1],
    reason: log[3],
    context: log[5],
    object: log[7],
    username: log[9],
    ageSeconds: Number(log[11]),
    clientInfo: log[13],
  }));
}
