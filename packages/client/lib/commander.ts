import { Command, CommanderConfig, RedisArgument, RedisCommands, RedisFunction, RedisFunctions, RedisModules, RedisScript, RedisScripts, RespVersions, TransformReply } from './RESP/types';

interface AttachConfigOptions<
  M extends RedisModules,
  F extends RedisFunctions,
  S extends RedisScripts,
  RESP extends RespVersions
> {
  BaseClass: new (...args: any) => any;
  commands: RedisCommands;
  createCommand(command: Command, resp: RespVersions): (...args: any) => any;
  createModuleCommand(command: Command, resp: RespVersions): (...args: any) => any;
  createFunctionCommand(name: string, fn: RedisFunction, resp: RespVersions): (...args: any) => any;
  createScriptCommand(script: RedisScript, resp: RespVersions): (...args: any) => any;
  config?: CommanderConfig<M, F, S, RESP>;
}

/* FIXME: better error message / link */
function throwResp3SearchModuleUnstableError() {
  throw new Error('Some RESP3 results for Redis Query Engine responses may change. Refer to the readme for guidance');
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
  const RESP = config?.RESP ?? 2,
    Class: any = class extends BaseClass {};

  for (const [name, command] of Object.entries(commands)) {
    if (config?.RESP == 3 && command.unstableResp3 && !config.unstableResp3) {
      Class.prototype[name] = throwResp3SearchModuleUnstableError;
    } else {
      Class.prototype[name] = createCommand(command, RESP);
    }
  }

  if (config?.modules) {
    for (const [moduleName, module] of Object.entries(config.modules)) {
      const fns = Object.create(null);
      for (const [name, command] of Object.entries(module)) {
        if (config.RESP == 3 && command.unstableResp3 && !config.unstableResp3) {
          fns[name] = throwResp3SearchModuleUnstableError;
        } else {
          fns[name] = createModuleCommand(command, RESP);
        }
      }

      attachNamespace(Class.prototype, moduleName, fns);
    }
  }

  if (config?.functions) {
    for (const [library, commands] of Object.entries(config.functions)) {
      const fns = Object.create(null);
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

function attachNamespace(prototype: any, name: PropertyKey, fns: any) {
  Object.defineProperty(prototype, name, {
    get() {
      const value = Object.create(fns);
      value._self = this;
      Object.defineProperty(this, name, { value });
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
