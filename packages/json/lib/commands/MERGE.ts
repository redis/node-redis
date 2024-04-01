import { ValkeyJSON, transformValkeyJsonArgument } from ".";

export const FIRST_KEY_INDEX = 1;

export function transformArguments(
  key: string,
  path: string,
  json: ValkeyJSON
): Array<string> {
  return ["JSON.MERGE", key, path, transformValkeyJsonArgument(json)];
}

export declare function transformReply(): "OK";
