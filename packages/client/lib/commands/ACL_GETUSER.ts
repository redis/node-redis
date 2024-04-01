import { ValkeyCommandArgument, ValkeyCommandArguments } from ".";

export function transformArguments(
  username: ValkeyCommandArgument
): ValkeyCommandArguments {
  return ["ACL", "GETUSER", username];
}

type AclGetUserRawReply = [
  "flags",
  Array<ValkeyCommandArgument>,
  "passwords",
  Array<ValkeyCommandArgument>,
  "commands",
  ValkeyCommandArgument,
  "keys",
  Array<ValkeyCommandArgument> | ValkeyCommandArgument,
  "channels",
  Array<ValkeyCommandArgument> | ValkeyCommandArgument,
  "selectors" | undefined,
  Array<Array<string>> | undefined
];

interface AclUser {
  flags: Array<ValkeyCommandArgument>;
  passwords: Array<ValkeyCommandArgument>;
  commands: ValkeyCommandArgument;
  keys: Array<ValkeyCommandArgument> | ValkeyCommandArgument;
  channels: Array<ValkeyCommandArgument> | ValkeyCommandArgument;
  selectors?: Array<Array<string>>;
}

export function transformReply(reply: AclGetUserRawReply): AclUser {
  return {
    flags: reply[1],
    passwords: reply[3],
    commands: reply[5],
    keys: reply[7],
    channels: reply[9],
    selectors: reply[11],
  };
}
