import { isNullReply } from "@redis/client/dist/lib/commands/generic-transformers";
import { BlobStringReply, NullReply, UnwrapReply } from "@redis/client/dist/lib/RESP/types";

export function transformRedisJsonNullReply(json: NullReply | BlobStringReply): NullReply | RedisJSON {
  return isNullReply(json) ? json : transformRedisJsonReply(json);
}

export type RedisJSON = null | boolean | number | string | Date | Array<RedisJSON> | {
  [key: string]: RedisJSON;
  [key: number]: RedisJSON;
};

export function transformRedisJsonArgument(json: RedisJSON): string {
  return JSON.stringify(json);
}

export function transformRedisJsonReply(json: BlobStringReply): RedisJSON {
  const res =  JSON.parse((json as unknown as UnwrapReply<typeof json>).toString());
  return res;
}
