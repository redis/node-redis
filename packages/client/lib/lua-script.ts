import { createHash } from 'node:crypto';
import { Command } from './RESP/types';

export type RedisScriptConfig = Command & {
  SCRIPT: string | Buffer;
  NUMBER_OF_KEYS?: number;
}

export interface SHA1 {
  SHA1: string;
}

export function defineScript<S extends RedisScriptConfig>(script: S): S & SHA1 {
  return {
    ...script,
    SHA1: scriptSha1(script.SCRIPT),
    FIRST_KEY_INDEX: script['NUMBER_OF_KEYS'] > 0 ? 0 : undefined,
  };
}

export function scriptSha1(script: RedisScriptConfig['SCRIPT']): string {
  return createHash('sha1').update(script).digest('hex');
}
