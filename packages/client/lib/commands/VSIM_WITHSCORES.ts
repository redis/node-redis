import {
  ArrayReply,
  BlobStringReply,
  Command,
  DoubleReply,
  MapReply,
  TypeMapping,
  UnwrapReply
} from '../RESP/types';
import { transformDoubleReply } from './generic-transformers';
import VSIM from './VSIM';

export default {
  parseCommand(...args: Parameters<typeof VSIM.parseCommand>) {
    const parser = args[0];

    VSIM.parseCommand(...args);
    parser.push('WITHSCORES');
  },
  transformReply: {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- matches TransformReply contract
    2: (reply: ArrayReply<BlobStringReply>, preserve?: any, typeMapping?: TypeMapping) => {
      const inferred = reply as unknown as UnwrapReply<typeof reply>;
      const members: Record<string, DoubleReply> = {};
      for (let i = 0; i < inferred.length; i += 2) {
        members[inferred[i].toString()] = transformDoubleReply[2](inferred[i + 1], preserve, typeMapping);
      }
      return members;
    },
    3: undefined as unknown as () => MapReply<BlobStringReply, DoubleReply>
  }
} as const satisfies Command;
