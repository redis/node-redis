import type { RedisCommands } from '@redis/client/lib/RESP/types';
import ADD from './ADD';
import ADDNX from './ADDNX';
import COUNT from './COUNT';
import DEL from './DEL';
import EXISTS from './EXISTS';
import INFO from './INFO';
import INSERT from './INSERT';
import INSERTNX from './INSERTNX';
import LOADCHUNK from './LOADCHUNK';
import RESERVE from './RESERVE';
import SCANDUMP from './SCANDUMP';

export default {
  ADD,
  add: ADD,
  ADDNX,
  addNX: ADDNX,
  COUNT,
  count: COUNT,
  DEL,
  del: DEL,
  EXISTS,
  exists: EXISTS,
  INFO,
  info: INFO,
  INSERT,
  insert: INSERT,
  INSERTNX,
  insertNX: INSERTNX,
  LOADCHUNK,
  loadChunk: LOADCHUNK,
  RESERVE,
  reserve: RESERVE,
  SCANDUMP,
  scanDump: SCANDUMP
} as const satisfies RedisCommands;
