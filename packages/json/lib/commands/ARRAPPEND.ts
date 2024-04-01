import { ValkeyJSON, transformValkeyJsonArgument } from ".";

export const FIRST_KEY_INDEX = 1;

export function transformArguments(
  key: string,
  path: string,
  ...jsons: Array<ValkeyJSON>
): Array<string> {
  const args = ["JSON.ARRAPPEND", key, path];

  for (const json of jsons) {
    args.push(transformValkeyJsonArgument(json));
  }

  return args;
}

export declare function transformReply(): number | Array<number>;
