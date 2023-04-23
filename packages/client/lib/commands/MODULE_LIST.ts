import { ArrayReply, BlobStringReply, NumberReply, Command, Resp2Reply, TuplesToMapReply } from '../RESP/types';

export type ModuleListReply = ArrayReply<TuplesToMapReply<[
  [BlobStringReply<'name'>, BlobStringReply],
  [BlobStringReply<'version'>, NumberReply],
]>>;

export default {
  IS_READ_ONLY: true,
  FIRST_KEY_INDEX: undefined,
  transformArguments() {
    return ['MODULE', 'LIST'];
  },
  transformReply: {
    2: (reply: Resp2Reply<ModuleListReply>) => {
      return reply.map(module => ({
        name: module[1],
        version: module[3]
      }));
    },
    3: undefined as unknown as () => ModuleListReply
  }
} as const satisfies Command;
