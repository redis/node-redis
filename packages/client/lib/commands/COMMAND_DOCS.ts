import { RedisCommandArguments } from '.';
import { pushVerdictArguments } from './generic-transformers';

export const IS_READ_ONLY = true;

export function transformArguments(keys: string | Array<string>): RedisCommandArguments {
    return pushVerdictArguments(['COMMAND', 'DOCS'], keys);
}

type CommandDocumentation = {
    summary: string;
    since: string;
    group: string;
    complexity: string;
    history?: Array<[versio: string, feature: string]>;
};

type CommandDocsReply = Array<[CommandName: string, CommandDocumentation: CommandDocumentation]>;

export function transformReply(rawReply: Array<any>): CommandDocsReply {
    const replyArray:CommandDocsReply = [];

    for (let i = 0; i < rawReply.length; i++) {
        
        replyArray.push([
            rawReply[i++], // The name of the command
            {
                summary: rawReply[i][1],
                since: rawReply[i][3],
                group: rawReply[i][5],
                complexity: rawReply[i][7],
                history: rawReply[i][8] == 'history' ? rawReply[i][9] : null
            }
        ]);
    }

    return replyArray;
}
