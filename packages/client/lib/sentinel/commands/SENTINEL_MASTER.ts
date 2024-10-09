import { RedisArgument, MapReply, BlobStringReply, Command } from '../../RESP/types';
import { transformTuplesReply } from '../../commands/generic-transformers';

export default {
  transformArguments(dbname: RedisArgument) {
    return ['SENTINEL', 'MASTER', dbname];
  },
  transformReply: {
    2: transformTuplesReply<BlobStringReply>,
    3: undefined as unknown as () => MapReply<BlobStringReply, BlobStringReply>
  }
} as const satisfies Command;
