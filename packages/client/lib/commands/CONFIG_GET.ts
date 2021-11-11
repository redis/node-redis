export function transformArguments(parameter: string): Array<string> {
    return ['CONFIG', 'GET', parameter];
}

export { transformReplyTuples as transformReply } from './generic-transformers';
