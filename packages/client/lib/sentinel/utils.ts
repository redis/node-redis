import { RedisNode } from './types';

/* TODO: should use map interface, would need a transform reply probably? as resp2 is list form, which this depends on */
export function parseNode(data: any): RedisNode | undefined{
  const flags: string = data[9];
  if (flags.includes("s_down")) {
    return undefined;
  }

  return { "host": data[3], "port": Number(data[5]) };
}

export function createNodeList(data: any) {
  var nodeList: Array<RedisNode> = [];

  for (const nodeData of data) {
    const node = parseNode(nodeData)
    if (node === undefined) {
      continue;
    }
    nodeList.push(node);
  }

  return nodeList;
}
