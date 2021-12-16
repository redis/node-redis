export function transformArguments(parameter: string): Array<string> {
    return ['CONFIG', 'GET', parameter];
}

export { transformReplyStringTuples as transformReply } from './generic-transformers';
