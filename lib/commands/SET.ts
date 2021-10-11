import { RedisCommandArguments } from '.';

export const FIRST_KEY_INDEX = 1;

interface EX {
    EX: number;
}

interface PX {
    PX: number
}

interface EXAT {
    EXAT: number;
}

interface PXAT {
    PXAT: number;
}

interface KEEPTTL {
    KEEPTTL: true;
}

type SetTTL = EX | PX | EXAT | PXAT | KEEPTTL | {};

interface NX {
    NX: true;
}

interface XX {
    XX: true;
}

type SetGuards = NX | XX | {};

interface SetCommonOptions {
    GET: true
}

type SetOptions = SetTTL & SetGuards & (SetCommonOptions | {});

export function transformArguments(key: string | Buffer, value: string | Buffer, options?: SetOptions): RedisCommandArguments {
    const args = ['SET', key, value];

    if (!options) {
        return args;
    }

    if ('EX' in options) {
        args.push('EX', options.EX.toString());
    } else if ('PX' in options) {
        args.push('PX', options.PX.toString());
    } else if ('EXAT' in options) {
        args.push('EXAT', options.EXAT.toString());
    } else if ('PXAT' in options) {
        args.push('PXAT', options.PXAT.toString());
    } else if ((<KEEPTTL>options).KEEPTTL) {
        args.push('KEEPTTL');
    }

    if ((<NX>options).NX) {
        args.push('NX');
    } else if ((<XX>options).XX) {
        args.push('XX');
    }

    if ((<SetCommonOptions>options).GET) {
        args.push('GET');
    }

    return args;
}

export function transformReply(reply?: string): string | null {
    return reply ?? null;
}
