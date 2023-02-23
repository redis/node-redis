import { fCallArguments } from './commander';
import { RedisCommand, RedisCommandArguments, RedisCommandRawReply, RedisFunction, RedisScript } from './commands';
import { WatchError } from './errors';

export interface RedisMultiQueuedCommand {
    args: RedisCommandArguments;
    transformReply?: RedisCommand['transformReply'];
}

export default class RedisMultiCommand {
    static generateChainId(): symbol {
        return Symbol('RedisMultiCommand Chain Id');
    }

    readonly queue: Array<RedisMultiQueuedCommand> = [];

    readonly scriptsInUse = new Set<string>();

    addCommand(args: RedisCommandArguments, transformReply?: RedisCommand['transformReply']): void {
        this.queue.push({
            args,
            transformReply
        });
    }

    addFunction(name: string, fn: RedisFunction, args: Array<unknown>): RedisCommandArguments {
        const transformedArguments = fCallArguments(
            name,
            fn,
            fn.transformArguments(...args)
        );
        this.queue.push({
            args: transformedArguments,
            transformReply: fn.transformReply
        });
        return transformedArguments;
    }

    addScript(script: RedisScript, args: Array<unknown>): RedisCommandArguments {
        const transformedArguments: RedisCommandArguments = [];
        if (this.scriptsInUse.has(script.SHA1)) {
            transformedArguments.push(
                'EVALSHA',
                script.SHA1
            );
        } else {
            this.scriptsInUse.add(script.SHA1);
            transformedArguments.push(
                'EVAL',
                script.SCRIPT
            );
        }

        if (script.NUMBER_OF_KEYS !== undefined) {
            transformedArguments.push(script.NUMBER_OF_KEYS.toString());
        }

        const scriptArguments = script.transformArguments(...args);
        transformedArguments.push(...scriptArguments);
        if (scriptArguments.preserve) {
            transformedArguments.preserve = scriptArguments.preserve;
        }

        this.addCommand(
            transformedArguments,
            script.transformReply
        );

        return transformedArguments;
    }

    handleExecReplies(rawReplies: Array<RedisCommandRawReply>): Array<RedisCommandRawReply> {
        const execReply = rawReplies[rawReplies.length - 1] as (null | Array<RedisCommandRawReply>);
        if (execReply === null) {
            throw new WatchError();
        }

        return this.transformReplies(execReply);
    }

    transformReplies(rawReplies: Array<RedisCommandRawReply>): Array<RedisCommandRawReply> {
        return rawReplies.map((reply, i) => {
            const { transformReply, args } = this.queue[i];
            return transformReply ? transformReply(reply, args.preserve) : reply;
        });
    }
}
