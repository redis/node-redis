import { BlobStringReply, Command, MapReply, RedisArgument } from "../RESP/types";
import { transformTuplesReply } from "./generic-transformers";

export default {
  transformArguments(dbname: RedisArgument) {
    return ['SENTINEL', 'MASTER', dbname];
  },
  transformReply: {
    2: transformTuplesReply,
    3: undefined as unknown as () => MapReply<BlobStringReply, BlobStringReply>
  }
} as const satisfies Command;