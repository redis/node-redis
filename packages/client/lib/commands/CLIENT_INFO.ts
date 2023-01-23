export const IS_READ_ONLY = true;

export function transformArguments(): Array<string> {
    return ['CLIENT', 'INFO'];
}

export interface ClientInfoReply {
    id: number;
    addr: string;
    laddr?: string; // 6.2
    fd: number;
    name: string;
    age: number;
    idle: number;
    flags: string;
    db: number;
    sub: number;
    psub: number;
    ssub?: number; // 7.0.3
    multi: number;
    qbuf: number;
    qbufFree: number;
    argvMem?: number; // 6.0
    multiMem?: number; // 7.0
    obl: number;
    oll: number;
    omem: number;
    totMem?: number; // 6.0
    events: string;
    cmd: string;
    user?: string; // 6.0
    redir?: number; // 6.2
    resp?: number; // 7.0
}

const CLIENT_INFO_REGEX = /([^\s=]+)=([^\s]*)/g;

export function transformReply(reply: string): ClientInfoReply {
    const map: Record<string, string> = {};
    for (const item of reply.matchAll(CLIENT_INFO_REGEX)) {
        map[item[1]] = item[2];
    }

    const clientInfoReply: ClientInfoReply = {
        id: Number(map.id),
        addr: map.addr,
        fd: Number(map.fd),
        name: map.name,
        age: Number(map.age),
        idle: Number(map.idle),
        flags: map.flags,
        db: Number(map.db),
        sub: Number(map.sub),
        psub: Number(map.psub),
        multi: Number(map.multi),
        qbuf: Number(map.qbuf),
        qbufFree: Number(map.qbuffree),
        argvMem: Number(map.argvmem),
        obl: Number(map.obl),
        oll: Number(map.oll),
        omem: Number(map.omem),
        totMem: Number(map.totmem),
        events: map.events,
        cmd: map.cmd,
        user: map.user
    };

    if (map.laddr !== undefined) {
        clientInfoReply.laddr = map.laddr;
    }

    if (map.redir !== undefined) {
        clientInfoReply.redir = Number(map.redir);
    }

    if (map.ssub !== undefined) {
        clientInfoReply.ssub = Number(map.ssub);
    }

    if (map.multimem !== undefined) {
        clientInfoReply.multiMem = Number(map.multimem);
    }

    if (map.resp !== undefined) {
        clientInfoReply.resp = Number(map.resp);
    }

    return clientInfoReply;
}
