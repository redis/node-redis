import COMMANDS from '../commands';
import RedisMultiCommand, { MULTI_REPLY, MultiReply, MultiReplyType } from '../multi-command';
import { ReplyWithTypeMapping, CommandReply, Command, CommandArguments, CommanderConfig, RedisFunctions, RedisModules, RedisScripts, RespVersions, TransformReply, RedisScript, RedisFunction, TypeMapping, RedisArgument } from '../RESP/types';
import { attachConfig, functionArgumentsPrefix, getTransformReply } from '../commander';
import RedisCluster, { RedisClusterType } from '.';

type CommandSignature<
  REPLIES extends Array<unknown>,
  C extends Command,
  M extends RedisModules,
  F extends RedisFunctions,
  S extends RedisScripts,
  RESP extends RespVersions,
  TYPE_MAPPING extends TypeMapping
> = (...args: Parameters<C['transformArguments']>) => RedisClusterMultiCommandType<
  [...REPLIES, ReplyWithTypeMapping<CommandReply<C, RESP>, TYPE_MAPPING>],
  M,
  F,
  S,
  RESP,
  TYPE_MAPPING
>;

type WithCommands<
  REPLIES extends Array<unknown>,
  M extends RedisModules,
  F extends RedisFunctions,
  S extends RedisScripts,
  RESP extends RespVersions,
  TYPE_MAPPING extends TypeMapping
> = {
  [P in keyof typeof COMMANDS]: CommandSignature<REPLIES, (typeof COMMANDS)[P], M, F, S, RESP, TYPE_MAPPING>;
};

type WithModules<
  REPLIES extends Array<unknown>,
  M extends RedisModules,
  F extends RedisFunctions,
  S extends RedisScripts,
  RESP extends RespVersions,
  TYPE_MAPPING extends TypeMapping
> = {
  [P in keyof M]: {
    [C in keyof M[P]]: CommandSignature<REPLIES, M[P][C], M, F, S, RESP, TYPE_MAPPING>;
  };
};

type WithFunctions<
  REPLIES extends Array<unknown>,
  M extends RedisModules,
  F extends RedisFunctions,
  S extends RedisScripts,
  RESP extends RespVersions,
  TYPE_MAPPING extends TypeMapping
> = {
  [L in keyof F]: {
    [C in keyof F[L]]: CommandSignature<REPLIES, F[L][C], M, F, S, RESP, TYPE_MAPPING>;
  };
};

type WithScripts<
  REPLIES extends Array<unknown>,
  M extends RedisModules,
  F extends RedisFunctions,
  S extends RedisScripts,
  RESP extends RespVersions,
  TYPE_MAPPING extends TypeMapping
> = {
  [P in keyof S]: CommandSignature<REPLIES, S[P], M, F, S, RESP, TYPE_MAPPING>;
};

export type RedisClusterMultiCommandType<
  REPLIES extends Array<any>,
  M extends RedisModules,
  F extends RedisFunctions,
  S extends RedisScripts,
  RESP extends RespVersions,
  TYPE_MAPPING extends TypeMapping
> = (
  RedisClusterMultiCommand<REPLIES> &
  WithCommands<REPLIES, M, F, S, RESP, TYPE_MAPPING> & 
  WithModules<REPLIES, M, F, S, RESP, TYPE_MAPPING> &
  WithFunctions<REPLIES, M, F, S, RESP, TYPE_MAPPING> &
  WithScripts<REPLIES, M, F, S, RESP, TYPE_MAPPING>
);

export default class RedisClusterMultiCommand<REPLIES = []> {
  private static _createCommand(command: Command, resp: RespVersions) {
    const transformReply = getTransformReply(command, resp);
    return function (this: RedisClusterMultiCommand, ...args: Array<unknown>) {
      const redisArgs = command.transformArguments(...args),
        firstKey = RedisCluster.extractFirstKey(
          command,
          args,
          redisArgs
        );
      return this.addCommand(
        firstKey,
        command.IS_READ_ONLY,
        redisArgs,
        transformReply
      );
    };
  }

  private static _createModuleCommand(command: Command, resp: RespVersions) {
    const transformReply = getTransformReply(command, resp);
    return function (this: { self: RedisClusterMultiCommand }, ...args: Array<unknown>) {
      const redisArgs = command.transformArguments(...args),
        firstKey = RedisCluster.extractFirstKey(
          command,
          args,
          redisArgs
        );
      return this.self.addCommand(
        firstKey,
        command.IS_READ_ONLY,
        redisArgs,
        transformReply
      );
    };
  }

  private static _createFunctionCommand(name: string, fn: RedisFunction, resp: RespVersions) {
    const prefix = functionArgumentsPrefix(name, fn),
      transformReply = getTransformReply(fn, resp);
    return function (this: { self: RedisClusterMultiCommand }, ...args: Array<unknown>) {
      const fnArgs = fn.transformArguments(...args),
        redisArgs: CommandArguments = prefix.concat(fnArgs),
        firstKey = RedisCluster.extractFirstKey(
          fn,
          args,
          fnArgs
        );
      redisArgs.preserve = fnArgs.preserve;
      return this.self.addCommand(
        firstKey,
        fn.IS_READ_ONLY,
        redisArgs,
        transformReply
      );
    };
  }

  private static _createScriptCommand(script: RedisScript, resp: RespVersions) {
    const transformReply = getTransformReply(script, resp);
    return function (this: RedisClusterMultiCommand, ...args: Array<unknown>) {
      const scriptArgs = script.transformArguments(...args);
      this._setState(
        RedisCluster.extractFirstKey(
          script,
          args,
          scriptArgs
        ),
        script.IS_READ_ONLY
      );
      this._multi.addScript(
        script,
        scriptArgs,
        transformReply
      );
      return this;
    };
  }

  static extend<
    M extends RedisModules = Record<string, never>,
    F extends RedisFunctions = Record<string, never>,
    S extends RedisScripts = Record<string, never>,
    RESP extends RespVersions = 2
  >(config?: CommanderConfig<M, F, S, RESP>) {
    return attachConfig({
      BaseClass: RedisClusterMultiCommand,
      commands: COMMANDS,
      createCommand: RedisClusterMultiCommand._createCommand,
      createModuleCommand: RedisClusterMultiCommand._createModuleCommand,
      createFunctionCommand: RedisClusterMultiCommand._createFunctionCommand,
      createScriptCommand: RedisClusterMultiCommand._createScriptCommand,
      config
    });
  }

  private readonly _multi = new RedisMultiCommand();
  private readonly _cluster: RedisClusterType;
  private _firstKey: RedisArgument | undefined;
  private _isReadonly: boolean | undefined = true;

  constructor(cluster: RedisClusterType, routing: RedisArgument | undefined) {
    this._cluster = cluster;
    this._firstKey = routing;
  }

  private _setState(
    firstKey: RedisArgument | undefined,
    isReadonly: boolean | undefined,
  ) {
    this._firstKey ??= firstKey;
    this._isReadonly &&= isReadonly;
  }

  addCommand(
    firstKey: RedisArgument | undefined,
    isReadonly: boolean | undefined,
    args: CommandArguments,
    transformReply?: TransformReply
  ) {
    this._setState(firstKey, isReadonly);
    this._multi.addCommand(args, transformReply);
    return this;
  }

  async exec<T extends MultiReply = MULTI_REPLY['GENERIC']>(execAsPipeline = false) {
    if (execAsPipeline) return this.execAsPipeline<T>();

    return this._multi.transformReplies(
      await this._cluster._executeMulti(
        this._firstKey,
        this._isReadonly,
        this._multi.queue
      )
    ) as MultiReplyType<T, REPLIES>;
  }

  EXEC = this.exec;

  execTyped(execAsPipeline = false) {
    return this.exec<MULTI_REPLY['TYPED']>(execAsPipeline);
  }

  async execAsPipeline<T extends MultiReply = MULTI_REPLY['GENERIC']>() {
    if (this._multi.queue.length === 0) return [] as MultiReplyType<T, REPLIES>;

    return this._multi.transformReplies(
      await this._cluster._executePipeline(
        this._firstKey,
        this._isReadonly,
        this._multi.queue
      )
    ) as MultiReplyType<T, REPLIES>;
  }

  execAsPipelineTyped() {
    return this.execAsPipeline<MULTI_REPLY['TYPED']>();
  }
}
