import * as RESERVE from './RESERVE';
import * as ADD from './ADD';
import * as MADD from './MADD';
import * as INSERT from './INSERT';
import * as EXISTS from './EXISTS';
import * as MEXISTS from './MEXISTS';
import * as SCANDUMP from './SCANDUMP';
import * as LOADCHUNK from './LOADCHUNK';
import * as INFO from './INFO';

export default {
    RESERVE,
    reserve: RESERVE,
    ADD,
    add: ADD,
    MADD,
    mAdd: MADD,
    INSERT,
    insert: INSERT,
    EXISTS,
    exists: EXISTS,
    MEXISTS,
    mExists: MEXISTS,
    SCANDUMP,
    scanDump: SCANDUMP,
    LOADCHUNK,
    loadChunk: LOADCHUNK,
    INFO,
    info: INFO
};