import { RESP_TYPES, TypeMapping } from "@redis/client";

export function transformInfoV2Reply<T>(reply: Array<unknown>, typeMapping?: TypeMapping): T {
  const entries = reply as Array<{ toString(): string }>;
  const mapType = typeMapping ? typeMapping[RESP_TYPES.MAP] : undefined;

  switch (mapType) {
    case Array: {
      return reply as unknown as T;
    }
    case Map: {
      const ret = new Map<string, unknown>();

      for (let i = 0; i < entries.length; i += 2) {
        ret.set(entries[i].toString(), entries[i + 1]);
      }

      return ret as unknown as T;
    }
    default: {
      const ret: Record<string, unknown> = {};

      for (let i = 0; i < entries.length; i += 2) {
        ret[entries[i].toString()] = entries[i + 1];
      }

      return ret as unknown as T;
    }
  }
}
