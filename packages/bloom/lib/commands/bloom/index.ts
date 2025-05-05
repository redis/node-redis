import type { RedisCommands } from '@redis/client/dist/lib/RESP/types';

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

export * from './helpers';

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
