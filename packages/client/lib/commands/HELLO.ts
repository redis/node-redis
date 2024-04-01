import { ValkeyCommandArgument, ValkeyCommandArguments } from ".";
import { AuthOptions } from "./AUTH";

interface HelloOptions {
  protover: number;
  auth?: Required<AuthOptions>;
  clientName?: string;
}

export function transformArguments(
  options?: HelloOptions
): ValkeyCommandArguments {
  const args: ValkeyCommandArguments = ["HELLO"];

  if (options) {
    args.push(options.protover.toString());

    if (options.auth) {
      args.push("AUTH", options.auth.username, options.auth.password);
    }

    if (options.clientName) {
      args.push("SETNAME", options.clientName);
    }
  }

  return args;
}

type HelloRawReply = [
  _: never,
  server: ValkeyCommandArgument,
  _: never,
  version: ValkeyCommandArgument,
  _: never,
  proto: number,
  _: never,
  id: number,
  _: never,
  mode: ValkeyCommandArgument,
  _: never,
  role: ValkeyCommandArgument,
  _: never,
  modules: Array<ValkeyCommandArgument>
];

interface HelloTransformedReply {
  server: ValkeyCommandArgument;
  version: ValkeyCommandArgument;
  proto: number;
  id: number;
  mode: ValkeyCommandArgument;
  role: ValkeyCommandArgument;
  modules: Array<ValkeyCommandArgument>;
}

export function transformReply(reply: HelloRawReply): HelloTransformedReply {
  return {
    server: reply[1],
    version: reply[3],
    proto: reply[5],
    id: reply[7],
    mode: reply[9],
    role: reply[11],
    modules: reply[13],
  };
}
