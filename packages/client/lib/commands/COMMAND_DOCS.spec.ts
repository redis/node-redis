import { strict as assert } from 'assert';
import testUtils, { GLOBAL } from '../test-utils';
import { transformArguments } from './COMMAND_DOCS';

describe('COMMAND DOCS', () => {
    testUtils.isVersionGreaterThanHook([7, 0]);

    it('transformArguments', () => {
        assert.deepEqual(
            transformArguments('SORT'),
            ['COMMAND', 'DOCS', 'SORT']
        );
    });

    testUtils.testWithClient('client.commandDocs', async client => {
        const docs = await client.commandDocs()
        assert.equal(typeof docs, 'object');

        for (const item of Object.values(docs)) {
            if (item.summary) assert.equal(typeof item.summary, 'string');
            if (item.since) assert.equal(typeof item.since, 'string');
            if (item.group) assert.equal(typeof item.group, 'string');
            if (item.complexity) assert.equal(typeof item.complexity, 'string');
            if (item.history) assert.ok(Array.isArray(item.history));
            if (item.arguments) {
                assert.equal(typeof item.arguments, 'object');
                for (const argument of Object.values(item.arguments)) {
                    if (argument.keySpecIndex) assert.equal(typeof argument.keySpecIndex, 'number');
                    if (argument.type) assert.equal(typeof argument.type, 'string');
                    if (argument.token) assert.equal(typeof argument.token, 'string');
                    if (argument.summary) assert.equal(typeof argument.summary, 'string');
                    if (argument.flags) assert.ok(Array.isArray(argument.flags));
                }
            }
            if (item.subCommands) assert.equal(typeof item.subCommands, 'object');
        }

        // check with commands names
        const specifiedDocs = await client.commandDocs('sort', 'get', 'cluster')
        assert.equal(typeof specifiedDocs, 'object');

        // check with non existing command
        const nonExistingCommandDocs = await client.commandDocs('foo')
        assert.equal(typeof specifiedDocs, 'object');

    }, GLOBAL.SERVERS.OPEN);
});
