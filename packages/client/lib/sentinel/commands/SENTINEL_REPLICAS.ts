import { RedisArgument, ArrayReply, BlobStringReply, MapReply, Command } from '../../RESP/types';
import { transformTuplesReply } from '../../commands/generic-transformers';

export default {
  transformArguments(dbname: RedisArgument) {
    return ['SENTINEL', 'REPLICAS', dbname];
  },
  transformReply: {
    2: (reply: any) => {
        const initial: Array<Record<string, BlobStringReply>> = [];
        return reply.reduce((sentinels: Array<Record<string, BlobStringReply>>, x: any) => { sentinels.push(transformTuplesReply(x)); return sentinels }, initial);
    },
    3: undefined as unknown as () => ArrayReply<MapReply<BlobStringReply, BlobStringReply>>
  }
} as const satisfies Command;
