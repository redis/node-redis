import { RedisCommandArguments } from '.';

export const FIRST_KEY_INDEX = 1;

type MaximumOneOf<T, K extends keyof T = keyof T> =
    K extends keyof T ? { [P in K]?: T[K] } & Partial<Record<Exclude<keyof T, K>, never>> : never;

type SetTTL = MaximumOneOf<{
    EX: number;
    PX: number;
    EXAT: number;
    PXAT: number;
    KEEPTTL: true;
}>;

type SetGuards = MaximumOneOf<{
    NX: true;
    XX: true;
}>;

interface SetCommonOptions {
    GET?: true;
}

type SetOptions = SetTTL & SetGuards & SetCommonOptions;

export function transformArguments(key: string | Buffer, value: string | Buffer, options?: SetOptions): RedisCommandArguments {
    const args = ['SET', key, value];

    if (!options) {
        return args;
    }

    if (options.EX) {
        args.push('EX', options.EX.toString());
    } else if (options.PX) {
        args.push('PX', options.PX.toString());
    } else if (options.EXAT) {
        args.push('EXAT', options.EXAT.toString());
    } else if (options.PXAT) {
        args.push('PXAT', options.PXAT.toString());
    } else if (options.KEEPTTL) {
        args.push('KEEPTTL');
    }

    if (options.NX) {
        args.push('NX');
    } else if (options.XX) {
        args.push('XX');
    }

    if (options.GET) {
        args.push('GET');
    }

    return args;
}

export function transformReply(reply?: string): string | null {
    return reply ?? null;
}
