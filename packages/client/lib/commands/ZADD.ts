import { transformArgumentNumberInfinity, ZMember } from './generic-transformers';

export const FIRST_KEY_INDEX = 1;

interface NX {
    NX?: true;
}

interface XX {
    XX?: true;
}

interface LT {
    LT?: true;
}

interface GT {
    GT?: true;
}

interface CH {
    CH?: true;
}

interface INCR {
    INCR?: true;
}

type ZAddOptions = (NX | (XX & LT & GT)) & CH & INCR;

export function transformArguments(key: string, members: ZMember | Array<ZMember>, options?: ZAddOptions): Array<string> {
    const args = ['ZADD', key];

    if ((<NX>options)?.NX) {
        args.push('NX');
    } else {
        if ((<XX>options)?.XX) {
            args.push('XX');
        }

        if ((<GT>options)?.GT) {
            args.push('GT');
        } else if ((<LT>options)?.LT) {
            args.push('LT');
        }
    }

    if ((<CH>options)?.CH) {
        args.push('CH');
    }

    if ((<INCR>options)?.INCR) {
        args.push('INCR');
    }

    for (const { score, value } of (Array.isArray(members) ? members : [members])) {
        args.push(
            transformArgumentNumberInfinity(score),
            value
        );
    }

    return args;
}

export { transformReplyNumberInfinity as transformReply } from './generic-transformers';
