import { TuplesReply, BlobStringReply, NumberReply, ArrayReply, UnwrapReply, Command } from '../RESP/types';
import { CommandParser } from '../client/parser';

type RawNode = TuplesReply<[
  host: BlobStringReply,
  port: NumberReply,
  id: BlobStringReply
]>;

type ClusterSlotsRawReply = ArrayReply<[
  from: NumberReply,
  to: NumberReply,
  master: RawNode,
  ...replicas: Array<RawNode>
]>;

export type ClusterSlotsNode = ReturnType<typeof transformNode>;

export default {
  FIRST_KEY_INDEX: undefined,
  IS_READ_ONLY: true,
  parseCommand(parser: CommandParser) {
    parser.pushVariadic(['CLUSTER', 'SLOTS']);
  },
  transformArguments() { return [] },
  transformReply(reply: UnwrapReply<ClusterSlotsRawReply>) {
    return reply.map(([from, to, master, ...replicas]) => ({
      from,
      to,
      master: transformNode(master),
      replicas: replicas.map(transformNode)
    }));
  }
} as const satisfies Command;

function transformNode(node: RawNode) {
  const [host, port, id] = node as unknown as UnwrapReply<typeof node>;
  return {
    host,
    port,
    id
  };
}
