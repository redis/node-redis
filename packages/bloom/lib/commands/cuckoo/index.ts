
import * as ADD from './ADD';
import * as ADDNX from './ADDNX';
import * as COUNT from './COUNT';
import * as DEL from './DEL';
import * as EXISTS from './EXISTS';
import * as INFO from './INFO';
import * as INSERT from './INSERT';
import * as INSERTNX from './INSERTNX';
import * as LOADCHUNK from './LOADCHUNK';
import * as RESERVE from './RESERVE';
import * as SCANDUMP from './SCANDUMP';
import { pushVerdictArguments } from '@redis/client/dist/lib/commands/generic-transformers';
import { RedisCommandArguments } from '@redis/client/dist/lib/commands';

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
};

export interface InsertOptions {
    CAPACITY?: number;
    NOCREATE?: true;
}

export function pushInsertOptions(
    args: RedisCommandArguments,
    items: string | Array<string>,
    options?: InsertOptions
): RedisCommandArguments {
    if (options?.CAPACITY) {
        args.push('CAPACITY');
        args.push(options.CAPACITY.toString());
    }

    if (options?.NOCREATE) {
        args.push('NOCREATE');
    }

    args.push('ITEMS');
    return pushVerdictArguments(args, items);
}
