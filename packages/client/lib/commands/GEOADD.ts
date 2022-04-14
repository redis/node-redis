import { RedisCommandArgument, RedisCommandArguments } from '.';
import { GeoCoordinates } from './generic-transformers';

export const FIRST_KEY_INDEX = 1;

interface GeoMember extends GeoCoordinates {
    member: RedisCommandArgument;
}

interface NX {
    NX?: true;
}

interface XX {
    XX?: true;
}

type SetGuards = NX | XX;

interface GeoAddCommonOptions {
    CH?: true;
}

type GeoAddOptions = SetGuards & GeoAddCommonOptions;

export function transformArguments(
    key: RedisCommandArgument, toAdd: GeoMember | Array<GeoMember>,
    options?: GeoAddOptions
): RedisCommandArguments {
    const args = ['GEOADD', key];

    if ((options as NX)?.NX) {
        args.push('NX');
    } else if ((options as XX)?.XX) {
        args.push('XX');
    }

    if (options?.CH) {
        args.push('CH');
    }

    for (const { longitude, latitude, member } of (Array.isArray(toAdd) ? toAdd : [toAdd])) {
        args.push(
            longitude.toString(),
            latitude.toString(),
            member
        );
    }

    return args;
}

export declare function transformReply(): number;
