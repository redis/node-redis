import type { CommandParser } from '../../client/parser';
import type { RedisClientType } from '../../client';
import type {
  RedisModules, RedisFunctions, RedisScripts, RespVersions, TypeMapping
} from '../../RESP/types';
import type RedisClusterSlots from '../cluster-slots';
import {
  aggregateLogicalAnd,
  aggregateLogicalOr,
  aggregateMax,
  aggregateMerge,
  aggregateMin,
  aggregateSum
} from './generic-aggregators';

type Client<
  M extends RedisModules,
  F extends RedisFunctions,
  S extends RedisScripts,
  RESP extends RespVersions,
  TM extends TypeMapping
> = RedisClientType<M, F, S, RESP, TM>;

type Slots<
  M extends RedisModules,
  F extends RedisFunctions,
  S extends RedisScripts,
  RESP extends RespVersions,
  TM extends TypeMapping
> = RedisClusterSlots<M, F, S, RESP, TM>;

export type RequestRouter<
  M extends RedisModules,
  F extends RedisFunctions,
  S extends RedisScripts,
  RESP extends RespVersions,
  TM extends TypeMapping
> = (
  slots: Slots<M, F, S, RESP, TM>,
  parser: CommandParser,
  isReadonly: boolean | undefined
) => Promise<Array<Client<M, F, S, RESP, TM>>>;

export type ResponseReducer<T> = (
  responsePromises: Promise<T>[],
  parser: CommandParser
) => Promise<T>;

// --- request routers ---

export const routeAllNodes: RequestRouter<any, any, any, any, any> =
  async (slots) => slots.getAllClients();

export const routeAllShards: RequestRouter<any, any, any, any, any> =
  async (slots) => slots.getAllMasterClients();

export const routeMultiShard: RequestRouter<any, any, any, any, any> =
  async (slots, parser, isReadonly) =>
    Promise.all(
      parser.keys.map(async (key) => (await slots.getClientAndSlotNumber(key, isReadonly)).client)
    );

export const routeDefaultKeyless: RequestRouter<any, any, any, any, any> =
  async (slots) => [slots.getRandomNode().client!];

export const routeDefaultKeyed: RequestRouter<any, any, any, any, any> =
  async (slots, parser, isReadonly) =>
    [(await slots.getClientAndSlotNumber(parser.firstKey, isReadonly)).client];

export const routeSpecial: RequestRouter<any, any, any, any, any> =
  async (_slots, parser) => {
    throw new Error(`Special request policy not implemented for ${parser.commandIdentifier}`);
  };

// --- response reducers ---

export const reduceOneSucceeded = <T>(promises: Promise<T>[]): Promise<T> =>
  Promise.any(promises);

export const reduceAllSucceeded = async <T>(promises: Promise<T>[]): Promise<T> => {
  const responses = await Promise.all(promises);
  return responses[0];
};

export const reduceLogicalAnd = async <T>(promises: Promise<T>[]): Promise<T> => {
  const responses = await Promise.all(promises);
  return aggregateLogicalAnd(responses) as T;
};

export const reduceLogicalOr = async <T>(promises: Promise<T>[]): Promise<T> => {
  const responses = await Promise.all(promises);
  return aggregateLogicalOr(responses) as T;
};

export const reduceMin = async <T>(promises: Promise<T>[]): Promise<T> => {
  const responses = await Promise.all(promises);
  return aggregateMin(responses) as T;
};

export const reduceMax = async <T>(promises: Promise<T>[]): Promise<T> => {
  const responses = await Promise.all(promises);
  return aggregateMax(responses) as T;
};

export const reduceSum = async <T>(promises: Promise<T>[]): Promise<T> => {
  const responses = await Promise.all(promises);
  return aggregateSum(responses) as T;
};

export const reduceSpecial = async <T>(_promises: Promise<T>[], parser: CommandParser): Promise<T> => {
  throw new Error(`Special response policy not implemented for ${parser.commandIdentifier}`);
};

export const reduceDefaultKeyless = async <T>(promises: Promise<T>[]): Promise<T> => {
  const responses = await Promise.all(promises);
  return aggregateMerge(responses) as T;
};

export const reduceDefaultKeyed = async <T>(promises: Promise<T>[]): Promise<T> => {
  const responses = await Promise.all(promises);
  return responses as T;
};
