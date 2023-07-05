import type { RedisCommands } from '@redis/client/dist/lib/RESP/types';
import ADD from './ADD';
import CARD from './CARD';
import EXISTS from './EXISTS';
// import INFO from './INFO';
import INSERT from './INSERT';
import LOADCHUNK from './LOADCHUNK';
import MADD from './MADD';
import MEXISTS from './MEXISTS';
import RESERVE from './RESERVE';
import SCANDUMP from './SCANDUMP';

type ADD = typeof import('./ADD').default;
type CARD = typeof import('./CARD').default;
type EXISTS = typeof import('./EXISTS').default;
// type INFO = typeof import('./INFO').default;
type INSERT = typeof import('./INSERT').default;
type LOADCHUNK = typeof import('./LOADCHUNK').default;
type MADD = typeof import('./MADD').default;
type MEXISTS = typeof import('./MEXISTS').default;
type RESERVE = typeof import('./RESERVE').default;
type SCANDUMP = typeof import('./SCANDUMP').default;

export default {
  ADD: ADD as ADD,
  add: ADD as ADD,
  CARD: CARD as CARD,
  card: CARD as CARD,
  EXISTS: EXISTS as EXISTS,
  exists: EXISTS as EXISTS,
  // INFO: INFO as INFO,
  // info: INFO as INFO,
  INSERT: INSERT as INSERT,
  insert: INSERT as INSERT,
  LOADCHUNK: LOADCHUNK as LOADCHUNK,
  loadChunk: LOADCHUNK as LOADCHUNK,
  MADD: MADD as MADD,
  mAdd: MADD as MADD,
  MEXISTS: MEXISTS as MEXISTS,
  mExists: MEXISTS as MEXISTS,
  RESERVE: RESERVE as RESERVE,
  reserve: RESERVE as RESERVE,
  SCANDUMP: SCANDUMP as SCANDUMP,
  scanDump: SCANDUMP as SCANDUMP
} satisfies RedisCommands;
