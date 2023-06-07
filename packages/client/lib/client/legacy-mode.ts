import { RedisModules, RedisFunctions, RedisScripts, RespVersions, TypeMapping, Command, CommandArguments, ReplyUnion } from '../RESP/types';
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
  private static _transformArguments(redisArgs: CommandArguments, args: LegacyCommandArguments) {
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

  private static _createCommand(name: string, command: Command, resp: RespVersions) {
    const transformReply = RedisLegacyClient.getTransformReply(command, resp);
    return async function (this: RedisLegacyClient, ...args: LegacyCommandArguments) {
      const redisArgs = [name],
        callback = RedisLegacyClient._transformArguments(redisArgs, args),
        promise = this._client.sendCommand(redisArgs);

      if (!callback) {
        promise.catch(err => this._client.emit('error', err));
        return;
      }

      promise
        .then(reply => callback(null, transformReply ? transformReply(reply) : reply))
        .catch(err => callback(err));
    };
  }

  private _Multi: ReturnType<typeof LegacyMultiCommand['factory']>;

  constructor(
    private _client: RedisClientType<RedisModules, RedisFunctions, RedisScripts>
  ) {
    const RESP = _client.options?.RESP ?? 2;
    for (const [name, command] of Object.entries(COMMANDS)) {
      // TODO: as any?
      (this as any)[name] = RedisLegacyClient._createCommand(
        name,
        command,
        RESP
      );
    }

    this._Multi = LegacyMultiCommand.factory(RESP);
  }

  sendCommand(...args: LegacyArguments) {
    const redisArgs: CommandArguments = [],
      callback = RedisLegacyClient._transformArguments(redisArgs, args),
      promise = this._client.sendCommand(redisArgs);

    if (!callback) {
      promise.catch(err => this._client.emit('error', err));
      return;
    }
  
    promise
      .then(reply => callback(null, reply))
      .catch(err => callback(err));
  }

  multi() {
    return this._Multi(this._client);
  }
}

type MultiWithCommands = {
  [P in keyof typeof COMMANDS]: (...args: LegacyCommandArguments) => RedisLegacyMultiType;
};

export type RedisLegacyMultiType = Omit<LegacyMultiCommand, '_client'> & MultiWithCommands;

class LegacyMultiCommand extends RedisMultiCommand {
  private static _createCommand(name: string, command: Command, resp: RespVersions) {
    const transformReply = RedisLegacyClient.getTransformReply(command, resp);
    return function (this: LegacyMultiCommand, ...args: LegacyArguments) {
      const redisArgs = [name];
      RedisLegacyClient.pushArguments(redisArgs, args);
      return this.addCommand(redisArgs, transformReply);
    };
  }

  static factory(resp: RespVersions) {
    const Multi = class extends LegacyMultiCommand {};

    for (const [name, command] of Object.entries(COMMANDS)) {
      // TODO: as any?
      (Multi as any).prototype[name] = LegacyMultiCommand._createCommand(
        name,
        command,
        resp
      );
    }

    return (client: RedisClientType<RedisModules, RedisFunctions, RedisScripts>) => {
      return new Multi(client) as unknown as RedisLegacyMultiType;
    };
  }

  private _client: RedisClientType<RedisModules, RedisFunctions, RedisScripts>;

  constructor(client: RedisClientType<RedisModules, RedisFunctions, RedisScripts>) {
    super();
    this._client = client;
  }

  sendCommand(...args: LegacyArguments) {
    const redisArgs: CommandArguments = [];
    RedisLegacyClient.pushArguments(redisArgs, args);
    return this.addCommand(redisArgs);
  }

  exec(cb?: (err: ErrorReply | null, replies?: Array<unknown>) => unknown) {
    const promise = this._client.executeMulti(this.queue);

    if (!cb) {
      promise.catch(err => this._client.emit('error', err));
      return;
    }

    promise
      .then(results => cb(null, this.transformReplies(results)))
      .catch(err => cb?.(err));
  }
}
