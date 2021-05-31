import { createHash } from 'crypto';
import { RedisCommand } from './commands';

export interface RedisLuaScriptConfig extends RedisCommand {
    SCRIPT: string;
    NUMBER_OF_KEYS: number;
}

interface SHA {
    SHA: string;
}

export type RedisLuaScript = RedisLuaScriptConfig & SHA;

export interface RedisLuaScripts {
    [key: string]: RedisLuaScript;
}

export function defineScript<S extends RedisLuaScriptConfig>(script: S): S & SHA {
    return {
        ...script,
        SHA: createHash('sha1').update(script.SCRIPT).digest('hex')
    };
}
