import { MapReply, BlobStringReply, Command } from '../RESP/types';
import { RedisVariadicArgument, pushVariadicArguments, transformTuplesReply } from './generic-transformers';

export default {
  FIRST_KEY_INDEX: undefined,
  IS_READ_ONLY: true,
  transformArguments(parameters: RedisVariadicArgument) {
    return pushVariadicArguments(['CONFIG', 'GET'], parameters);
  },
  transformReply: {
    2: transformTuplesReply,
    3: undefined as unknown as () => MapReply<BlobStringReply, BlobStringReply>
  }
} as const satisfies Command;
