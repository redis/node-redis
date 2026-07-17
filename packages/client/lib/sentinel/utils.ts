import { ArrayReply, Command, RedisFunction, RedisScript, RespVersions, UnwrapReply } from '../RESP/types';
import { BasicCommandParser } from '../client/parser';
import { RedisSocketOptions, RedisTcpSocketOptions } from '../client/socket';
import { functionArgumentsPrefix, getTransformReply, scriptArgumentsPrefix } from '../commander';
import { defaultCommandMetadata, isReplicaSafe } from '../command-metadata';
import { NamespaceProxySentinel, NamespaceProxySentinelClient, NodeAddressMap, ProxySentinel, ProxySentinelClient, RedisNode } from './types';

/* TODO: should use map interface, would need a transform reply probably? as resp2 is list form, which this depends on */
export function parseNode(node: Record<string, string>): RedisNode | undefined{

  if (node.flags.includes("s_down") || node.flags.includes("disconnected") || node.flags.includes("failover_in_progress")) {
    return undefined;
  }

  return { host: node.ip, port: Number(node.port) };
}

export function createNodeList(nodes: UnwrapReply<ArrayReply<Record<string, string>>>) {
  const nodeList: Array<RedisNode> = [];

  for (const nodeData of nodes) {
    const node = parseNode(nodeData)
    if (node === undefined) {
      continue;
    }
    nodeList.push(node);
  }

  return nodeList;
}

/**
 * Merges configured seed nodes with nodes discovered from a sentinel, deduping
 * by `host:port`. Seeds are kept first so DNS-based hostnames remain available
 * for reconnection even after a full outage where sentinels return new IPs
 * (see issue #3237).
 */
export function mergeSentinelNodes(
  seedNodes: Array<RedisNode>,
  discoveredNodes: Array<RedisNode>
): Array<RedisNode> {
  const seen = new Set<string>();
  const merged: Array<RedisNode> = [];

  for (const node of [...seedNodes, ...discoveredNodes]) {
    const key = `${node.host}:${node.port}`;
    if (!seen.has(key)) {
      // Clone so the working root-nodes list never aliases the frozen seed
      // node objects (or the discovered ones).
      merged.push({ host: node.host, port: node.port });
      seen.add(key);
    }
  }

  return merged;
}

export function clientSocketToNode(socket: RedisSocketOptions): RedisNode {
  const s = socket as RedisTcpSocketOptions;

  return {
    host: s.host!,
    port: s.port!
  }
}

export function createCommand<T extends ProxySentinel | ProxySentinelClient>(command: Command, resp: RespVersions) {
  const transformReply = getTransformReply(command, resp);
  // Resolved once from the wire identifier (known only after the first parse)
  // and reused — the command function is a shared prototype method. A defined
  // `IS_READ_ONLY` wins over the table (see `isReplicaSafe`).
  let replicaSafe: boolean | undefined;

  return async function (this: T, ...args: Array<unknown>) {
    const parser = new BasicCommandParser(this._self._keyPrefix);
    command.parseCommand(parser, ...args);

    replicaSafe ??= isReplicaSafe(defaultCommandMetadata.lookup(parser.commandIdentifier), command.IS_READ_ONLY);

    return this._self._execute(
      replicaSafe,
      client => client._executeCommand(command, parser, this.commandOptions, transformReply)
    );
  };
}

export function createFunctionCommand<T extends NamespaceProxySentinel | NamespaceProxySentinelClient>(name: string, fn: RedisFunction, resp: RespVersions) {
  const prefix = functionArgumentsPrefix(name, fn);
  const transformReply = getTransformReply(fn, resp);

  return async function (this: T, ...args: Array<unknown>) {
    const parser = new BasicCommandParser(this._self._keyPrefix);
    parser.push(...prefix);
    fn.parseCommand(parser, ...args);

    return this._self._execute(
      fn.IS_READ_ONLY,
      client => client._executeCommand(fn, parser, this._self.commandOptions, transformReply)
    );
  }
};

export function createModuleCommand<T extends NamespaceProxySentinel | NamespaceProxySentinelClient>(command: Command, resp: RespVersions) {
  const transformReply = getTransformReply(command, resp);
  let replicaSafe: boolean | undefined;

  return async function (this: T, ...args: Array<unknown>) {
    const parser = new BasicCommandParser(this._self._keyPrefix);
    command.parseCommand(parser, ...args);

    replicaSafe ??= isReplicaSafe(defaultCommandMetadata.lookup(parser.commandIdentifier), command.IS_READ_ONLY);

    return this._self._execute(
      replicaSafe,
      client => client._executeCommand(command, parser, this._self.commandOptions, transformReply)
    );
  }
};

export function createScriptCommand<T extends ProxySentinel | ProxySentinelClient>(script: RedisScript, resp: RespVersions) {
  const prefix = scriptArgumentsPrefix(script);
  const transformReply = getTransformReply(script, resp);

  return async function (this: T, ...args: Array<unknown>) {
    const parser = new BasicCommandParser(this._self._keyPrefix);
    parser.push(...prefix);
    script.parseCommand(parser, ...args);

    return this._self._execute(
      script.IS_READ_ONLY,
      client => client._executeScript(script, parser, this.commandOptions, transformReply)
    );
  };
}

/**
 * Returns the mapped node address for the given host and port using the nodeAddressMap.
 * If no mapping exists, returns the original host and port.
 *
 * @param host The original host
 * @param port The original port
 * @param nodeAddressMap The node address map (object or function)
 * @returns The mapped node or the original node if no mapping exists
 */
export function getMappedNode(
  host: string,
  port: number,
  nodeAddressMap: NodeAddressMap | undefined
): RedisNode {
  if (nodeAddressMap === undefined) {
    return { host, port };
  }

  const address = `${host}:${port}`;

  switch (typeof nodeAddressMap) {
    case 'object':
      return nodeAddressMap[address] ?? { host, port };
    case 'function':
      return nodeAddressMap(address) ?? { host, port };
  }
}
