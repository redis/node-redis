import type { RedisCommands } from '@redis/client/dist/lib/RESP/types';
import ADD from './ADD';
import ADDNX from './ADDNX';
import COUNT from './COUNT';
import DEL from './DEL';
import EXISTS from './EXISTS';
// import INFO from './INFO';
import INSERT from './INSERT';
import INSERTNX from './INSERTNX';
import LOADCHUNK from './LOADCHUNK';
import RESERVE from './RESERVE';
import SCANDUMP from './SCANDUMP';

type ADD = typeof import('./ADD').default;
type ADDNX = typeof import('./ADDNX').default;
type COUNT = typeof import('./COUNT').default;
type DEL = typeof import('./DEL').default;
type EXISTS = typeof import('./EXISTS').default;
// type INFO = typeof import('./INFO').default;
type INSERT = typeof import('./INSERT').default;
type INSERTNX = typeof import('./INSERTNX').default;
type LOADCHUNK = typeof import('./LOADCHUNK').default;
type RESERVE = typeof import('./RESERVE').default;
type SCANDUMP = typeof import('./SCANDUMP').default;

export default {
  ADD: ADD as ADD,
  add: ADD as ADD,
  ADDNX: ADDNX as ADDNX,
  addNX: ADDNX as ADDNX,
  COUNT: COUNT as COUNT,
  count: COUNT as COUNT,
  DEL: DEL as DEL,
  del: DEL as DEL,
  EXISTS: EXISTS as EXISTS,
  exists: EXISTS as EXISTS,
  // INFO: INFO as INFO,
  // info: INFO as INFO,
  INSERT: INSERT as INSERT,
  insert: INSERT as INSERT,
  INSERTNX: INSERTNX as INSERTNX,
  insertNX: INSERTNX as INSERTNX,
  LOADCHUNK: LOADCHUNK as LOADCHUNK,
  loadChunk: LOADCHUNK as LOADCHUNK,
  RESERVE: RESERVE as RESERVE,
  reserve: RESERVE as RESERVE,
  SCANDUMP: SCANDUMP as SCANDUMP,
  scanDump: SCANDUMP as SCANDUMP
} as const satisfies RedisCommands;
