import { NodeInfo, RedisNode } from './types';

/* TODO: should use map interface, would need a transform reply probably? as resp2 is list form, which this depends on */
export function parseNode(node: NodeInfo): RedisNode | undefined{
  if (node.flags.includes("s_down")) {
    return undefined;
  }

  return { "host": node.ip, "port": Number(node.port) };
}

export function createNodeList(nodes: Array<NodeInfo>) {
  var nodeList: Array<RedisNode> = [];

  for (const nodeData of nodes) {
    const node = parseNode(nodeData)
    if (node === undefined) {
      continue;
    }
    nodeList.push(node);
  }

  return nodeList;
}
