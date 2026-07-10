import { Command, CommanderConfig, RedisArgument, RedisCommands, RedisFunction, RedisFunctions, RedisModules, RedisScript, RedisScripts, RespVersions, TransformReply, DEFAULT_RESP } from './RESP/types';

interface AttachConfigOptions<
  M extends RedisModules,
  F extends RedisFunctions,
  S extends RedisScripts,
  RESP extends RespVersions
> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- factory contract: arbitrary constructor
  BaseClass: new (...args: any) => any;
  commands: RedisCommands;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- factory contract: arbitrary command function
  createCommand(command: Command, resp: RespVersions): (...args: any) => any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- factory contract: arbitrary command function
  createModuleCommand(command: Command, resp: RespVersions): (...args: any) => any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- factory contract: arbitrary command function
  createFunctionCommand(name: string, fn: RedisFunction, resp: RespVersions): (...args: any) => any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- factory contract: arbitrary command function
  createScriptCommand(script: RedisScript, resp: RespVersions): (...args: any) => any;
  config?: CommanderConfig<M, F, S, RESP>;
}

export function attachConfig<
  M extends RedisModules,
  F extends RedisFunctions,
  S extends RedisScripts,
  RESP extends RespVersions
>({
  BaseClass,
  commands,
  createCommand,
  createModuleCommand,
  createFunctionCommand,
  createScriptCommand,
  config
}: AttachConfigOptions<M, F, S, RESP>) {
  const RESP = config?.RESP ?? DEFAULT_RESP,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- dynamic prototype patching
    Class: any = class extends BaseClass {};

  for (const [name, command] of Object.entries(commands)) {
    Class.prototype[name] = createCommand(command, RESP);
  }

  if (config?.modules) {
    for (const [moduleName, module] of Object.entries(config.modules)) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any -- dynamic command namespace
      const fns: Record<string, (...args: Array<any>) => any> = {};
      for (const [name, command] of Object.entries(module)) {
        fns[name] = createModuleCommand(command, RESP);
      }

      attachNamespace(Class.prototype, moduleName, fns);
    }
  }

  if (config?.functions) {
    for (const [library, commands] of Object.entries(config.functions)) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any -- dynamic command namespace
      const fns: Record<string, (...args: Array<any>) => any> = {};
      for (const [name, command] of Object.entries(commands)) {
        fns[name] = createFunctionCommand(name, command, RESP);
      }

      attachNamespace(Class.prototype, library, fns);
    }
  }

  if (config?.scripts) {
    for (const [name, script] of Object.entries(config.scripts)) {
      Class.prototype[name] = createScriptCommand(script, RESP);
    }
  }

  return Class;
}

// Per-receiver namespace cache. Keyed by the receiver (original instance or any
// `withCommandOptions(...)` proxy) so each one gets a namespace bound to itself
// via `_self`. Caching the namespace as an own property on the receiver — which
// is what an earlier version did — leaks across the prototype chain: a proxy
// created via `Object.create(original)` would inherit the original's cached
// namespace and `_self` would point back to the original, silently bypassing
// the proxy's command-options overrides for every module/function command.
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- namespaces are dynamically shaped per module
const namespaceCache = new WeakMap<object, Map<PropertyKey, any>>();

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- dynamic prototype patching helper
function attachNamespace(prototype: any, name: PropertyKey, fns: any) {
  Object.defineProperty(prototype, name, {
    get() {
      let perReceiver = namespaceCache.get(this);
      if (perReceiver === undefined) {
        perReceiver = new Map();
        namespaceCache.set(this, perReceiver);
      }
      let value = perReceiver.get(name);
      if (value === undefined) {
        value = Object.create(fns);
        value._self = this;
        // Forward command options to the receiver so namespaced commands
        // (`client.module.foo(...)`) resolve the same options chain as
        // top-level commands, including `withCommandOptions(...)` proxies.
        Object.defineProperty(value, '_commandOptions', {
          get() { return this._self._commandOptions; },
          enumerable: true,
          configurable: false
        });
        perReceiver.set(name, value);
      }
      return value;
    }
  });
}

export function getTransformReply(command: Command, resp: RespVersions): TransformReply | undefined {
  switch (typeof command.transformReply) {
    case 'function':
      return command.transformReply;

    case 'object':
      return command.transformReply[resp];
  }
}

export function functionArgumentsPrefix(name: string, fn: RedisFunction) {
  const prefix: Array<RedisArgument> = [
    fn.IS_READ_ONLY ? 'FCALL_RO' : 'FCALL',
    name
  ];

  if (fn.NUMBER_OF_KEYS !== undefined) {
    prefix.push(fn.NUMBER_OF_KEYS.toString());
  }

  return prefix;
}

export function scriptArgumentsPrefix(script: RedisScript) {
  const prefix: Array<string | Buffer> = [
    script.IS_READ_ONLY ? 'EVALSHA_RO' : 'EVALSHA',
    script.SHA1
  ];

  if (script.NUMBER_OF_KEYS !== undefined) {
    prefix.push(script.NUMBER_OF_KEYS.toString());
  }

  return prefix;
}
