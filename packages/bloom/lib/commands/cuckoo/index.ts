import * as RESERVE from './RESERVE';
import * as ADD from './ADD';
import * as ADDNX from './ADDNX';
import * as DEL from './DEL';
import * as COUNT from './COUNT';
import * as INSERT from './INSERT';
import * as INSERTNX from './INSERTNX';
import * as EXISTS from './EXISTS';
import * as SCANDUMP from './SCANDUMP';
import * as LOADCHUNK from './LOADCHUNK';
import * as INFO from './INFO';
import { pushVerdictArguments } from '@node-redis/client/lib/commands/generic-transformers';

export default {
    RESERVE,
    reserve: RESERVE,
    ADD,
    add: ADD,
    ADDNX,
    addNX: ADDNX,
    DEL,
    del: DEL,
    COUNT,
    count: COUNT,
    INSERT,
    insert: INSERT,    
    INSERTNX,
    insertNX: INSERTNX,
    EXISTS,
    exists: EXISTS,
    SCANDUMP,
    scanDump: SCANDUMP,
    LOADCHUNK,
    loadChunk: LOADCHUNK,
    INFO,
    info: INFO
};

export type InsertOptions = {
    capacity?: number,
    nocreate?: true,
}

export function pushInsertOptions(args: Array<string>, items: Array<string>, options?: InsertOptions) {
    if (options?.capacity) {
        args.push('CAPACITY');
        args.push(options.capacity.toString());
    }

    if (options?.nocreate) {
        args.push('NOCREATE');
    }

    args.push('ITEMS');
    pushVerdictArguments(args, items)
}

export function transformArrayReply(reply: Array<string>): Array<boolean> {
    return reply.map(a => a == '1');
}

export function transformStringReply(reply: string): boolean {
    return reply == '1';
}
