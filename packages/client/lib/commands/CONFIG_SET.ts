import { ValkeyCommandArgument, ValkeyCommandArguments } from ".";

type SingleParameter = [
  parameter: ValkeyCommandArgument,
  value: ValkeyCommandArgument
];

type MultipleParameters = [config: Record<string, ValkeyCommandArgument>];

export function transformArguments(
  ...[parameterOrConfig, value]: SingleParameter | MultipleParameters
): ValkeyCommandArguments {
  const args: ValkeyCommandArguments = ["CONFIG", "SET"];

  if (typeof parameterOrConfig === "string") {
    args.push(parameterOrConfig, value!);
  } else {
    for (const [key, value] of Object.entries(parameterOrConfig)) {
      args.push(key, value);
    }
  }

  return args;
}

export declare function transformReply(): string;
