import {
  ValkeyModules,
  ValkeyFunctions,
  ValkeyScripts,
  createClient as _createClient,
  ValkeyClientOptions,
  ValkeyClientType as _ValkeyClientType,
  createCluster as _createCluster,
  ValkeyClusterOptions,
  ValkeyClusterType as _ValkeyClusterType,
} from "@valkey/client";
import ValkeyBloomModules from "@valkey/bloom";
import ValkeyGraph from "@valkey/graph";
import ValkeyJSON from "@valkey/json";
import ValkeySearch from "@valkey/search";
import ValkeyTimeSeries from "@valkey/time-series";

export * from "@valkey/client";
export * from "@valkey/bloom";
export * from "@valkey/graph";
export * from "@valkey/json";
export * from "@valkey/search";
export * from "@valkey/time-series";

const modules = {
  ...ValkeyBloomModules,
  graph: ValkeyGraph,
  json: ValkeyJSON,
  ft: ValkeySearch,
  ts: ValkeyTimeSeries,
};

export type ValkeyDefaultModules = typeof modules;

export type ValkeyClientType<
  M extends ValkeyModules = ValkeyDefaultModules,
  F extends ValkeyFunctions = Record<string, never>,
  S extends ValkeyScripts = Record<string, never>
> = _ValkeyClientType<M, F, S>;

export function createClient<
  M extends ValkeyModules,
  F extends ValkeyFunctions,
  S extends ValkeyScripts
>(
  options?: ValkeyClientOptions<M, F, S>
): _ValkeyClientType<ValkeyDefaultModules & M, F, S> {
  return _createClient({
    ...options,
    modules: {
      ...modules,
      ...(options?.modules as M),
    },
  });
}

export type ValkeyClusterType<
  M extends ValkeyModules = ValkeyDefaultModules,
  F extends ValkeyFunctions = Record<string, never>,
  S extends ValkeyScripts = Record<string, never>
> = _ValkeyClusterType<M, F, S>;

export function createCluster<
  M extends ValkeyModules,
  F extends ValkeyFunctions,
  S extends ValkeyScripts
>(
  options: ValkeyClusterOptions<M, F, S>
): ValkeyClusterType<ValkeyDefaultModules & M, F, S> {
  return _createCluster({
    ...options,
    modules: {
      ...modules,
      ...(options?.modules as M),
    },
  });
}
