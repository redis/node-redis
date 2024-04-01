import { ClientCommandOptions } from "../client";
import { CommandOptions } from "../command-options";
import { ValkeyScriptConfig, SHA1 } from "../lua-script";

export type ValkeyCommandRawReply =
  | string
  | number
  | Buffer
  | null
  | undefined
  | Array<ValkeyCommandRawReply>;

export type ValkeyCommandArgument = string | Buffer;

export type ValkeyCommandArguments = Array<ValkeyCommandArgument> & {
  preserve?: unknown;
};

export interface ValkeyCommand {
  FIRST_KEY_INDEX?:
    | number
    | ((...args: Array<any>) => ValkeyCommandArgument | undefined);
  IS_READ_ONLY?: boolean;
  TRANSFORM_LEGACY_REPLY?: boolean;
  transformArguments(this: void, ...args: Array<any>): ValkeyCommandArguments;
  transformReply?(this: void, reply: any, preserved?: any): any;
}

export type ValkeyCommandReply<C extends ValkeyCommand> =
  C["transformReply"] extends (...args: any) => infer T
    ? T
    : ValkeyCommandRawReply;

export type ConvertArgumentType<Type, ToType> =
  Type extends ValkeyCommandArgument
    ? Type extends string & ToType
      ? Type
      : ToType
    : Type extends Set<infer Member>
    ? Set<ConvertArgumentType<Member, ToType>>
    : Type extends Map<infer Key, infer Value>
    ? Map<Key, ConvertArgumentType<Value, ToType>>
    : Type extends Array<infer Member>
    ? Array<ConvertArgumentType<Member, ToType>>
    : Type extends Date
    ? Type
    : Type extends Record<PropertyKey, any>
    ? {
        [Property in keyof Type]: ConvertArgumentType<Type[Property], ToType>;
      }
    : Type;

export type ValkeyCommandSignature<
  Command extends ValkeyCommand,
  Params extends Array<unknown> = Parameters<Command["transformArguments"]>
> = <Options extends CommandOptions<ClientCommandOptions>>(
  ...args: Params | [options: Options, ...rest: Params]
) => Promise<
  ConvertArgumentType<
    ValkeyCommandReply<Command>,
    Options["returnBuffers"] extends true ? Buffer : string
  >
>;

export interface ValkeyCommands {
  [command: string]: ValkeyCommand;
}

export interface ValkeyModule {
  [command: string]: ValkeyCommand;
}

export interface ValkeyModules {
  [module: string]: ValkeyModule;
}

export interface ValkeyFunction extends ValkeyCommand {
  NUMBER_OF_KEYS?: number;
}

export interface ValkeyFunctionLibrary {
  [fn: string]: ValkeyFunction;
}

export interface ValkeyFunctions {
  [library: string]: ValkeyFunctionLibrary;
}

export type ValkeyScript = ValkeyScriptConfig & SHA1;

export interface ValkeyScripts {
  [script: string]: ValkeyScript;
}

export interface ValkeyExtensions<
  M extends ValkeyModules = ValkeyModules,
  F extends ValkeyFunctions = ValkeyFunctions,
  S extends ValkeyScripts = ValkeyScripts
> {
  modules?: M;
  functions?: F;
  scripts?: S;
}

export type ExcludeMappedString<S> = string extends S ? never : S;
