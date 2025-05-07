import { RESP_TYPES, TypeMapping } from "@redis/client";

export function transformInfoV2Reply<T>(reply: Array<any>, typeMapping?: TypeMapping): T {
  const mapType = typeMapping ? typeMapping[RESP_TYPES.MAP] : undefined;

  switch (mapType) {
    case Array: {
      return reply as unknown as T;
    }
    case Map: {
      const ret = new Map<string, any>();

      for (let i = 0; i < reply.length; i += 2) {
        ret.set(reply[i].toString(), reply[i + 1]);
      }

      return ret as unknown as T;
    }
    default: {
      const ret = Object.create(null);

      for (let i = 0; i < reply.length; i += 2) {
        ret[reply[i].toString()] = reply[i + 1];
      }

      return ret as unknown as T;
    }
  }
}