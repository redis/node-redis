/**
 * Compile-time regression for https://github.com/redis/node-redis/issues/3300
 * Checked with `npm run test:types -w @redis/client`.
 */
import { createClient, type RedisClientOptions, type RedisClientType } from '../../index';

type OptionsDefaultResp = [RedisClientOptions] extends [
  RedisClientOptions<{}, {}, {}, infer RESP, {}>
] ? RESP : never;

type ClientDefaultResp = [RedisClientType] extends [
  RedisClientType<{}, {}, {}, infer RESP, {}>
] ? RESP : never;

type AssertMatchingRespDefaults = [OptionsDefaultResp] extends [ClientDefaultResp]
  ? [ClientDefaultResp] extends [OptionsDefaultResp]
    ? true
    : never
  : never;

export type Issue3300Regression = AssertMatchingRespDefaults;

function buildOptions(): RedisClientOptions {
  return {
    url: 'redis://localhost:6379',
  };
}

export async function createRedisClient(): Promise<RedisClientType> {
  const options = buildOptions();
  const client = createClient(options);

  await client.connect();

  return client;
}
