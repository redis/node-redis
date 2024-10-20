import type { RedisCommands, TypeMapping } from '@redis/client/lib/RESP/types';

import ADD from './ADD';
import CARD from './CARD';
import EXISTS from './EXISTS';
import INFO from './INFO';
import INSERT from './INSERT';
import LOADCHUNK from './LOADCHUNK';
import MADD from './MADD';
import MEXISTS from './MEXISTS';
import RESERVE from './RESERVE';
import SCANDUMP from './SCANDUMP';
import { RESP_TYPES } from '@redis/client';

export default {
  ADD,
  add: ADD,
  CARD,
  card: CARD,
  EXISTS,
  exists: EXISTS,
  INFO,
  info: INFO,
  INSERT,
  insert: INSERT,
  LOADCHUNK,
  loadChunk: LOADCHUNK,
  MADD,
  mAdd: MADD,
  MEXISTS,
  mExists: MEXISTS,
  RESERVE,
  reserve: RESERVE,
  SCANDUMP,
  scanDump: SCANDUMP
} as const satisfies RedisCommands;

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