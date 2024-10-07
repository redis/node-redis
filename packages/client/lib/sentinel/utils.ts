import { ArrayReply, Command, RedisFunction, RedisScript, RespVersions, UnwrapReply } from '../RESP/types';
import { RedisSocketOptions, RedisTcpSocketOptions } from '../client/socket';
import { functionArgumentsPrefix, getTransformReply, scriptArgumentsPrefix } from '../commander';
import { NamespaceProxySentinel, NamespaceProxySentinelClient, ProxySentinel, ProxySentinelClient, RedisNode } from './types';

/* TODO: should use map interface, would need a transform reply probably? as resp2 is list form, which this depends on */
export function parseNode(node: Record<string, string>): RedisNode | undefined{
 
  if (node.flags.includes("s_down") || node.flags.includes("disconnected") || node.flags.includes("failover_in_progress")) {
    return undefined;
  }

  return { host: node.ip, port: Number(node.port) };
}

export function createNodeList(nodes: UnwrapReply<ArrayReply<Record<string, string>>>) {
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

export function clientSocketToNode(socket: RedisSocketOptions): RedisNode {
  const s = socket as RedisTcpSocketOptions;

  return {
    host: s.host!,
    port: s.port!
  }
}

export function createCommand<T extends ProxySentinel | ProxySentinelClient>(command: Command, resp: RespVersions) {
  const transformReply = getTransformReply(command, resp);
  return async function (this: T, ...args: Array<unknown>) {
    const redisArgs = command.transformArguments(...args);
    const typeMapping = this._self.commandOptions?.typeMapping;

    const reply = await this._self.sendCommand(
      command.IS_READ_ONLY,
      redisArgs,
      this._self.commandOptions
    );

    return transformReply ?
      transformReply(reply, redisArgs.preserve, typeMapping) :
      reply;
  };
}

export function createFunctionCommand<T extends NamespaceProxySentinel | NamespaceProxySentinelClient>(name: string, fn: RedisFunction, resp: RespVersions) {
  const prefix = functionArgumentsPrefix(name, fn),
  transformReply = getTransformReply(fn, resp);
  return async function (this: T, ...args: Array<unknown>) {
    const fnArgs = fn.transformArguments(...args);
    const redisArgs = prefix.concat(fnArgs);
    const typeMapping = this._self._self.commandOptions?.typeMapping;

    const reply = await this._self._self.sendCommand(
      fn.IS_READ_ONLY,
      redisArgs,
      this._self._self.commandOptions
    );

    return transformReply ?
      transformReply(reply, fnArgs.preserve, typeMapping) :
      reply;
  }
};

export function createModuleCommand<T extends NamespaceProxySentinel | NamespaceProxySentinelClient>(command: Command, resp: RespVersions) {
  const transformReply = getTransformReply(command, resp);
  return async function (this: T, ...args: Array<unknown>) {
    const redisArgs = command.transformArguments(...args);
    const typeMapping = this._self._self.commandOptions?.typeMapping;

    const reply = await this._self._self.sendCommand(
      command.IS_READ_ONLY,
      redisArgs,
      this._self._self.commandOptions
    );

    return transformReply ?
      transformReply(reply, redisArgs.preserve, typeMapping) :
      reply;
  }
};

export function createScriptCommand<T extends ProxySentinel | ProxySentinelClient>(script: RedisScript, resp: RespVersions) {
  const prefix = scriptArgumentsPrefix(script),
    transformReply = getTransformReply(script, resp);
  return async function (this: T, ...args: Array<unknown>) {
    const scriptArgs = script.transformArguments(...args);
    const redisArgs = prefix.concat(scriptArgs);
    const typeMapping = this._self.commandOptions?.typeMapping;

    const reply = await this._self.executeScript(
      script,
      script.IS_READ_ONLY,
      redisArgs,
      this._self.commandOptions
    );

    return transformReply ?
      transformReply(reply, scriptArgs.preserve, typeMapping) :
      reply;
  };
}
