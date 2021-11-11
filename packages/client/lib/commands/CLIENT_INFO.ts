export function transformArguments(): Array<string> {
    return ['CLIENT', 'INFO'];
}

interface ClientInfoReply {
    id: number;
    addr: string;
    laddr: string;
    fd: number;
    name: string;
    age: number;
    idle: number;
    flags: string;
    db: number;
    sub: number;
    psub: number;
    multi: number;
    qbuf: number;
    qbufFree: number;
    argvMem: number;
    obl: number;
    oll: number;
    omem: number;
    totMem: number;
    events: string;
    cmd: string;
    user: string;
    redir: number;
}

const REGEX = /=([^\s]*)/g;

export function transformReply(reply: string): ClientInfoReply {
    const [
        [, id],
        [, addr],
        [, laddr],
        [, fd],
        [, name],
        [, age],
        [, idle],
        [, flags],
        [, db],
        [, sub],
        [, psub],
        [, multi],
        [, qbuf],
        [, qbufFree],
        [, argvMem],
        [, obl],
        [, oll],
        [, omem],
        [, totMem],
        [, events],
        [, cmd],
        [, user],
        [, redir]
    ] = [...reply.matchAll(REGEX)];

    return {
        id: Number(id),
        addr,
        laddr,
        fd: Number(fd),
        name,
        age: Number(age),
        idle: Number(idle),
        flags,
        db: Number(db),
        sub: Number(sub),
        psub: Number(psub),
        multi: Number(multi),
        qbuf: Number(qbuf),
        qbufFree: Number(qbufFree),
        argvMem: Number(argvMem),
        obl: Number(obl),
        oll: Number(oll),
        omem: Number(omem),
        totMem: Number(totMem),
        events,
        cmd,
        user,
        redir: Number(redir)
    };
}
