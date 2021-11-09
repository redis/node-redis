import { strict as assert } from 'assert';
import testUtils, { GLOBAL } from '../test-utils';
import { transformArguments } from './SYNUPDATE';

describe('SYNUPDATE', () => {
    describe('transformArguments', () => {
        it('single term', () => {
            assert.deepEqual(
                transformArguments('index', 'groupId', 'term'),
                ['FT.SYNUPDATE', 'index', 'groupId', 'term']
            );
        });

        it('multiple terms', () => {
            assert.deepEqual(
                transformArguments('index', 'groupId', ['1', '2']),
                ['FT.SYNUPDATE', 'index', 'groupId', '1', '2']
            );
        });

        it('with SKIPINITIALSCAN', () => {
            assert.deepEqual(
                transformArguments('index', 'groupId', 'term', { SKIPINITIALSCAN: true }),
                ['FT.SYNUPDATE', 'index', 'groupId', 'SKIPINITIALSCAN', 'term']
            );
        });
    });

    testUtils.testWithClient('client.ft.synUpdate', async client => {
        await client.ft.create('index', {}, {
            ON: 'HASH' // TODO: shouldn't be mandatory
        });

        assert.equal(
            await client.ft.synUpdate('index', 'groupId', 'term'),
            'OK'
        );
    }, GLOBAL.SERVERS.OPEN);
});
