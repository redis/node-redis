import ValkeyClient from "./lib/client";
import ValkeyCluster from "./lib/cluster";

export { ValkeyClientType, ValkeyClientOptions } from "./lib/client";

export { ValkeyModules, ValkeyFunctions, ValkeyScripts } from "./lib/commands";

export const createClient = ValkeyClient.create;

export const commandOptions = ValkeyClient.commandOptions;

export { ValkeyClusterType, ValkeyClusterOptions } from "./lib/cluster";

export const createCluster = ValkeyCluster.create;

export { defineScript } from "./lib/lua-script";

export * from "./lib/errors";

export { GeoReplyWith } from "./lib/commands/generic-transformers";

export { SetOptions } from "./lib/commands/SET";

export { ValkeyFlushModes } from "./lib/commands/FLUSHALL";
