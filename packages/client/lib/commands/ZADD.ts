import { RedisArgument, NumberReply, DoubleReply, Command } from '../RESP/types';
import { ZMember, transformDoubleArgument, transformDoubleReply } from './generic-transformers';

interface NX {
  NX?: boolean;
}

interface XX {
  XX?: boolean;
}

interface LT {
  LT?: boolean;
}

interface GT {
  GT?: boolean;
}

interface CH {
  CH?: boolean;
}

interface INCR {
  INCR?: boolean;
}

export type ZAddOptions = (NX | (XX & LT & GT)) & CH & INCR;

export default {
  FIRST_KEY_INDEX: 1,
  transformArguments(
    key: RedisArgument,
    members: ZMember | Array<ZMember>,
    options?: ZAddOptions
  ) {
    const args = ['ZADD', key];

    if ((<NX>options)?.NX) {
      args.push('NX');
    } else {
      if ((<XX>options)?.XX) {
        args.push('XX');
      }

      if ((<GT>options)?.GT) {
        args.push('GT');
      }

      if ((<LT>options)?.LT) {
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
        transformDoubleArgument(score),
        value
      );
    }

    return args;
  },
  transformReply: {
    2: transformDoubleReply,
    3: undefined as unknown as () => NumberReply | DoubleReply
  }
} as const satisfies Command;
