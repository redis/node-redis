import { RedisCommandArgument, RedisCommandArguments } from '.';

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

export type SetOptions = SetTTL & SetGuards & SetCommonOptions;

export function transformArguments(
    key: RedisCommandArgument,
    value: RedisCommandArgument | number,
    options?: SetOptions
): RedisCommandArguments {
    const args = [
        'SET',
        key,
        typeof value === 'number' ? value.toString() : value
    ];

	const { EX, PX, EXAT, PXAT, KEEPTTL, NX, XX, GET } = options || {};

    if (EX !== undefined) {
        args.push('EX', EX.toString());
    } else if (PX !== undefined) {
        args.push('PX', PX.toString());
    } else if (EXAT !== undefined) {
        args.push('EXAT', EXAT.toString());
    } else if (PXAT !== undefined) {
        args.push('PXAT', PXAT.toString());
    } else if (KEEPTTL) {
        args.push('KEEPTTL');
    }

    if (NX) {
        args.push('NX');
    } else if (XX) {
        args.push('XX');
    }

    if (GET) {
        args.push('GET');
    }

    return args;
}

export declare function transformReply(): RedisCommandArgument | null;
