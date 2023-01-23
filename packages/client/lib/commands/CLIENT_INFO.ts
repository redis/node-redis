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

export function transformReply(rawReply: string): ClientInfoReply {
    const map: Record<string, string> = {};
    for (const item of rawReply.matchAll(CLIENT_INFO_REGEX)) {
        map[item[1]] = item[2];
    }

    const reply: ClientInfoReply = {
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
        qbufFree: Number(map['qbuf-free']),
        argvMem: Number(map['argv-mem']),
        obl: Number(map.obl),
        oll: Number(map.oll),
        omem: Number(map.omem),
        totMem: Number(map['tot-mem']),
        events: map.events,
        cmd: map.cmd,
        user: map.user
    };

    if (map.laddr !== undefined) {
        reply.laddr = map.laddr;
    }

    if (map.redir !== undefined) {
        reply.redir = Number(map.redir);
    }

    if (map.ssub !== undefined) {
        reply.ssub = Number(map.ssub);
    }

    if (map['multi-mem'] !== undefined) {
        reply.multiMem = Number(map['multi-mem']);
    }

    if (map.resp !== undefined) {
        reply.resp = Number(map.resp);
    }

    return reply;
}
