export function transformArguments(parameter: string): Array<string> {
    return ['CONFIG', 'GET', parameter];
}

export { transformTuplesReply as transformReply } from './generic-transformers';
