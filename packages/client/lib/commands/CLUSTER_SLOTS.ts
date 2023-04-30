import { NumberReply, ArrayReply, BlobStringReply, Command } from '../RESP/types';

type RawNode = [
  host: BlobStringReply,
  port: NumberReply,
  id: BlobStringReply
];

type ClusterSlotsRawReply = ArrayReply<[
  from: NumberReply,
  to: NumberReply,
  master: RawNode,
  ...replicas: Array<RawNode>
]>;

export type ClusterSlotsNode = ReturnType<typeof transformNode>;

export default {
  IS_READ_ONLY: true,
  transformArguments() {
    return ['CLUSTER', 'SLOTS'];
  },
  transformReply(reply: ClusterSlotsRawReply) {
    return reply.map(([from, to, master, ...replicas]) => ({
      from,
      to,
      master: transformNode(master),
      replicas: replicas.map(transformNode)
    }));
  }
} as const satisfies Command;

function transformNode([host, port, id ]: RawNode) {
  return {
    host,
    port,
    id
  };
}
