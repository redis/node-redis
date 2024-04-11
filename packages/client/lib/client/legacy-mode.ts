import { RedisModules, RedisFunctions, RedisScripts, RespVersions, Command, CommandArguments, ReplyUnion } from '../RESP/types';
import { RedisClientType } from '.';
import { getTransformReply } from '../commander';
import { ErrorReply } from '../errors';
import COMMANDS from '../commands';
import RedisMultiCommand from '../multi-command';

type LegacyArgument = string | Buffer | number | Date;

type LegacyArguments = Array<LegacyArgument | LegacyArguments>;

type LegacyCallback = (err: ErrorReply | null, reply?: ReplyUnion) => unknown

type LegacyCommandArguments = LegacyArguments | [
  ...args: LegacyArguments,
  callback: LegacyCallback
];

type WithCommands = {
  [P in keyof typeof COMMANDS]: (...args: LegacyCommandArguments) => void;
};

export type RedisLegacyClientType = RedisLegacyClient & WithCommands;

export class RedisLegacyClient {
  static #transformArguments(redisArgs: CommandArguments, args: LegacyCommandArguments) {
    let callback: LegacyCallback | undefined;
    if (typeof args[args.length - 1] === 'function') {
      callback = args.pop() as LegacyCallback;
    }

    RedisLegacyClient.pushArguments(redisArgs, args as LegacyArguments);

    return callback;
  }

  static pushArguments(redisArgs: CommandArguments, args: LegacyArguments) {
    for (let i = 0; i < args.length; ++i) {
      const arg = args[i];
      if (Array.isArray(arg)) {
        RedisLegacyClient.pushArguments(redisArgs, arg);
      } else {
        redisArgs.push(
          typeof arg === 'number' || arg instanceof Date ?
            arg.toString() :
            arg
        );
      }
    }
  }

  static getTransformReply(command: Command, resp: RespVersions) {
    return command.TRANSFORM_LEGACY_REPLY ?
      getTransformReply(command, resp) :
      undefined;
  }

  static #createCommand(name: string, command: Command, resp: RespVersions) {
    const transformReply = RedisLegacyClient.getTransformReply(command, resp);
    return function (this: RedisLegacyClient, ...args: LegacyCommandArguments) {
      const redisArgs = [name],
        callback = RedisLegacyClient.#transformArguments(redisArgs, args),
        promise = this.#client.sendCommand(redisArgs);

      if (!callback) {
        promise.catch(err => this.#client.emit('error', err));
        return;
      }

      promise
        .then(reply => callback(null, transformReply ? transformReply(reply) : reply))
        .catch(err => callback(err));
    };
  }

  #client: RedisClientType<RedisModules, RedisFunctions, RedisScripts>;
  #Multi: ReturnType<typeof LegacyMultiCommand['factory']>;

  constructor(
    client: RedisClientType<RedisModules, RedisFunctions, RedisScripts>
  ) {
    this.#client = client;

    const RESP = client.options?.RESP ?? 2;
    for (const [name, command] of Object.entries(COMMANDS)) {
      // TODO: as any?
      (this as any)[name] = RedisLegacyClient.#createCommand(
        name,
        command,
        RESP
      );
    }

    this.#Multi = LegacyMultiCommand.factory(RESP);
  }

  sendCommand(...args: LegacyCommandArguments) {
    const redisArgs: CommandArguments = [],
      callback = RedisLegacyClient.#transformArguments(redisArgs, args),
      promise = this.#client.sendCommand(redisArgs);

    if (!callback) {
      promise.catch(err => this.#client.emit('error', err));
      return;
    }
  
    promise
      .then(reply => callback(null, reply))
      .catch(err => callback(err));
  }

  multi() {
    return this.#Multi(this.#client);
  }
}

type MultiWithCommands = {
  [P in keyof typeof COMMANDS]: (...args: LegacyCommandArguments) => RedisLegacyMultiType;
};

export type RedisLegacyMultiType = LegacyMultiCommand & MultiWithCommands;

class LegacyMultiCommand {
  static #createCommand(name: string, command: Command, resp: RespVersions) {
    const transformReply = RedisLegacyClient.getTransformReply(command, resp);
    return function (this: LegacyMultiCommand, ...args: LegacyArguments) {
      const redisArgs = [name];
      RedisLegacyClient.pushArguments(redisArgs, args);
      this.#multi.addCommand(redisArgs, transformReply);
      return this;
    };
  }

  static factory(resp: RespVersions) {
    const Multi = class extends LegacyMultiCommand {};

    for (const [name, command] of Object.entries(COMMANDS)) {
      // TODO: as any?
      (Multi as any).prototype[name] = LegacyMultiCommand.#createCommand(
        name,
        command,
        resp
      );
    }

    return (client: RedisClientType<RedisModules, RedisFunctions, RedisScripts>) => {
      return new Multi(client) as unknown as RedisLegacyMultiType;
    };
  }

  readonly #multi = new RedisMultiCommand();
  readonly #client: RedisClientType<RedisModules, RedisFunctions, RedisScripts>;

  constructor(client: RedisClientType<RedisModules, RedisFunctions, RedisScripts>) {
    this.#client = client;
  }

  sendCommand(...args: LegacyArguments) {
    const redisArgs: CommandArguments = [];
    RedisLegacyClient.pushArguments(redisArgs, args);
    this.#multi.addCommand(redisArgs);
    return this;
  }

  exec(cb?: (err: ErrorReply | null, replies?: Array<unknown>) => unknown) {
    const promise = this.#client._executeMulti(this.#multi.queue);

    if (!cb) {
      promise.catch(err => this.#client.emit('error', err));
      return;
    }

    promise
      .then(results => cb(null, this.#multi.transformReplies(results)))
      .catch(err => cb?.(err));
  }
}
