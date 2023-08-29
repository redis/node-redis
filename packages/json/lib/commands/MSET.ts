import { RedisJSON, transformRedisJsonArgument } from ".";

export const FIRST_KEY_INDEX = 1;

export function transformArguments(
    keys: Array<string>,
    path: string,
    json: Array<RedisJSON>
): Array<string> {
    
    if (keys.length != json.length)
        throw new Error("Number of keys and json objects must be equal");

    let args: Array<string> = ["JSON.SET"];

    // walk through the key array, adding the key, the path and the json objects, calling transformRedisJsonArgument for each
    for (let i = 0; i < keys.length; i++) {
        args.push(keys[i], path, transformRedisJsonArgument(json[i]));
    }

    return args;
}

export declare function transformReply(): "OK" | null;
