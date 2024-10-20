import COMMANDS from '../commands';
import RedisMultiCommand, { MULTI_REPLY, MultiReply, MultiReplyType } from '../multi-command';
import { ReplyWithTypeMapping, CommandReply, Command, CommandArguments, CommanderConfig, RedisFunctions, RedisModules, RedisScripts, RespVersions, TransformReply, RedisScript, RedisFunction, TypeMapping } from '../RESP/types';
import { attachConfig, functionArgumentsPrefix, getTransformReply } from '../commander';
import { RedisSentinelType } from './types';
import { BasicCommandParser } from '../client/parser';
import { Tail } from '../commands/generic-transformers';

type CommandSignature<
  REPLIES extends Array<unknown>,
  C extends Command,
  M extends RedisModules,
  F extends RedisFunctions,
  S extends RedisScripts,
  RESP extends RespVersions,
  TYPE_MAPPING extends TypeMapping
> = (...args: Tail<Parameters<C['parseCommand']>>) => RedisSentinelMultiCommandType<
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

export type RedisSentinelMultiCommandType<
  REPLIES extends Array<any>,
  M extends RedisModules,
  F extends RedisFunctions,
  S extends RedisScripts,
  RESP extends RespVersions,
  TYPE_MAPPING extends TypeMapping
> = (
  RedisSentinelMultiCommand<REPLIES> &
  WithCommands<REPLIES, M, F, S, RESP, TYPE_MAPPING> & 
  WithModules<REPLIES, M, F, S, RESP, TYPE_MAPPING> &
  WithFunctions<REPLIES, M, F, S, RESP, TYPE_MAPPING> &
  WithScripts<REPLIES, M, F, S, RESP, TYPE_MAPPING>
);

export default class RedisSentinelMultiCommand<REPLIES = []> {
  private static _createCommand(command: Command, resp: RespVersions) {
    const transformReply = getTransformReply(command, resp);

    return function (this: RedisSentinelMultiCommand, ...args: Array<unknown>) {
      const parser = new BasicCommandParser(resp);
      command.parseCommand(parser, ...args);

      const redisArgs: CommandArguments = parser.redisArgs;
      redisArgs.preserve = parser.preserve;

      return this.addCommand(
        command.IS_READ_ONLY,
        redisArgs,
        transformReply
      );
    };
  }

  private static _createModuleCommand(command: Command, resp: RespVersions) {
    const transformReply = getTransformReply(command, resp);

    return function (this: { _self: RedisSentinelMultiCommand }, ...args: Array<unknown>) {
      const parser = new BasicCommandParser(resp);
      command.parseCommand(parser, ...args);

      const redisArgs: CommandArguments = parser.redisArgs;
      redisArgs.preserve = parser.preserve;

      return this._self.addCommand(
        command.IS_READ_ONLY,
        redisArgs,
        transformReply
      );
    };
  }

  private static _createFunctionCommand(name: string, fn: RedisFunction, resp: RespVersions) {
    const prefix = functionArgumentsPrefix(name, fn);
    const transformReply = getTransformReply(fn, resp);

    return function (this: { _self: RedisSentinelMultiCommand }, ...args: Array<unknown>) {
      const parser = new BasicCommandParser(resp);
      parser.push(...prefix);
      fn.parseCommand(parser, ...args);

      const redisArgs: CommandArguments = parser.redisArgs;
      redisArgs.preserve = parser.preserve;

      return this._self.addCommand(
        fn.IS_READ_ONLY,
        redisArgs,
        transformReply
      );
    };
  }

  private static _createScriptCommand(script: RedisScript, resp: RespVersions) {
    const transformReply = getTransformReply(script, resp);

    return function (this: RedisSentinelMultiCommand, ...args: Array<unknown>) {
      const parser = new BasicCommandParser(resp);
      script.parseCommand(parser, ...args);

      const scriptArgs: CommandArguments = parser.redisArgs;
      scriptArgs.preserve = parser.preserve;

      return this.addScript(
        script.IS_READ_ONLY,
        script,
        scriptArgs,
        transformReply
      );
    };
  }

  static extend<
    M extends RedisModules = Record<string, never>,
    F extends RedisFunctions = Record<string, never>,
    S extends RedisScripts = Record<string, never>,
    RESP extends RespVersions = 2
  >(config?: CommanderConfig<M, F, S, RESP>) {
    return attachConfig({
      BaseClass: RedisSentinelMultiCommand,
      commands: COMMANDS,
      createCommand: RedisSentinelMultiCommand._createCommand,
      createModuleCommand: RedisSentinelMultiCommand._createModuleCommand,
      createFunctionCommand: RedisSentinelMultiCommand._createFunctionCommand,
      createScriptCommand: RedisSentinelMultiCommand._createScriptCommand,
      config
    });
  }

  readonly #multi = new RedisMultiCommand();
  readonly #sentinel: RedisSentinelType
  #isReadonly: boolean | undefined = true;

  constructor(sentinel: RedisSentinelType, typeMapping: TypeMapping) {
    this.#multi = new RedisMultiCommand(typeMapping);
    this.#sentinel = sentinel;
  }

  #setState(
    isReadonly: boolean | undefined,
  ) {
    this.#isReadonly &&= isReadonly;
  }

  addCommand(
    isReadonly: boolean | undefined,
    args: CommandArguments,
    transformReply?: TransformReply
  ) {
    this.#setState(isReadonly);
    this.#multi.addCommand(args, transformReply);
    return this;
  }

  addScript(
    isReadonly: boolean | undefined,
    script: RedisScript,
    args: CommandArguments,
    transformReply?: TransformReply
  ) {
    this.#setState(isReadonly);
    this.#multi.addScript(script, args, transformReply);

    return this;
  }

  async exec<T extends MultiReply = MULTI_REPLY['GENERIC']>(execAsPipeline = false) {
    if (execAsPipeline) return this.execAsPipeline<T>();

    return this.#multi.transformReplies(
      await this.#sentinel._executeMulti(
        this.#isReadonly,
        this.#multi.queue
      )
    ) as MultiReplyType<T, REPLIES>;
  }

  EXEC = this.exec;

  execTyped(execAsPipeline = false) {
    return this.exec<MULTI_REPLY['TYPED']>(execAsPipeline);
  }

  async execAsPipeline<T extends MultiReply = MULTI_REPLY['GENERIC']>() {
    if (this.#multi.queue.length === 0) return [] as MultiReplyType<T, REPLIES>;

    return this.#multi.transformReplies(
      await this.#sentinel._executePipeline(
        this.#isReadonly,
        this.#multi.queue
      )
    ) as MultiReplyType<T, REPLIES>;
  }

  execAsPipelineTyped() {
    return this.execAsPipeline<MULTI_REPLY['TYPED']>();
  }
}
