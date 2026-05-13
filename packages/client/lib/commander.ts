import { Command, CommanderConfig, RedisArgument, RedisCommands, RedisFunction, RedisFunctions, RedisModules, RedisScript, RedisScripts, RespVersions, TransformReply } from './RESP/types';

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
  const RESP = config?.RESP ?? 3,
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

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- dynamic prototype patching helper
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
