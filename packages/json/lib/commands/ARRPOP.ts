import { ValkeyJSON, transformValkeyJsonNullReply } from ".";

export const FIRST_KEY_INDEX = 1;

export function transformArguments(
  key: string,
  path?: string,
  index?: number
): Array<string> {
  const args = ["JSON.ARRPOP", key];

  if (path) {
    args.push(path);

    if (index !== undefined && index !== null) {
      args.push(index.toString());
    }
  }

  return args;
}

export function transformReply(
  reply: null | string | Array<null | string>
): null | ValkeyJSON | Array<ValkeyJSON> {
  if (reply === null) return null;

  if (Array.isArray(reply)) {
    return reply.map(transformValkeyJsonNullReply);
  }

  return transformValkeyJsonNullReply(reply);
}
