import { ArrayReply, TuplesReply, BlobStringReply, NullReply, UnwrapReply, Command } from '@redis/client/dist/lib/RESP/types';

export default {
  FIRST_KEY_INDEX: undefined,
  IS_READ_ONLY: true,
  transformArguments(option: string) {
    return ['FT.CONFIG', 'GET', option];
  },
  transformReply(reply: UnwrapReply<ArrayReply<TuplesReply<[BlobStringReply, BlobStringReply | NullReply]>>>) {
    const transformedReply: Record<string, BlobStringReply | NullReply> = Object.create(null);
    for (const item of reply) {
      const [key, value] = item as unknown as UnwrapReply<typeof item>;
      transformedReply[key.toString()] = value;
    }

    return transformedReply;
  }
} as const satisfies Command;


export function transformArguments(option: string) {
    return ['FT.CONFIG', 'GET', option];
}

interface ConfigGetReply {
    [option: string]: string | null;
}

export function transformReply(rawReply: Array<[string, string | null]>): ConfigGetReply {
    const transformedReply: ConfigGetReply = Object.create(null);
    for (const [key, value] of rawReply) {
        transformedReply[key] = value;
    }

    return transformedReply;
}
