import { ValkeyJSON, transformValkeyJsonArgument } from ".";

export const FIRST_KEY_INDEX = 1;

interface NX {
  NX: true;
}

interface XX {
  XX: true;
}

export function transformArguments(
  key: string,
  path: string,
  json: ValkeyJSON,
  options?: NX | XX
): Array<string> {
  const args = ["JSON.SET", key, path, transformValkeyJsonArgument(json)];

  if ((<NX>options)?.NX) {
    args.push("NX");
  } else if ((<XX>options)?.XX) {
    args.push("XX");
  }

  return args;
}

export declare function transformReply(): "OK" | null;
