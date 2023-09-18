import { strict as assert } from 'assert';
import testUtils, { GLOBAL } from '../test-utils';
import { transformArguments } from './RESTORE';

describe('RESTORE', () => {
    describe('transformArguments', () => {
        it('simple', () => {
            assert.deepEqual(
                transformArguments('key', 0, 'value'),
                ['RESTORE', 'key', '0', 'value']
            );
        });

        it('with REPLACE', () => {
            assert.deepEqual(
                transformArguments('key', 0, 'value', {
                    REPLACE: true
                }),
                ['RESTORE', 'key', '0', 'value', 'REPLACE']
            );
        });

        it('with ABSTTL', () => {
            assert.deepEqual(
                transformArguments('key', 0, 'value', {
                    ABSTTL: true
                }),
                ['RESTORE', 'key', '0', 'value', 'ABSTTL']
            );
        });

        it('with IDLETIME', () => {
            assert.deepEqual(
                transformArguments('key', 0, 'value', {
                    IDLETIME: 1
                }),
                ['RESTORE', 'key', '0', 'value', 'IDLETIME', '1']
            );
        });

        it('with FREQ', () => {
            assert.deepEqual(
                transformArguments('key', 0, 'value', {
                    FREQ: 1
                }),
                ['RESTORE', 'key', '0', 'value', 'FREQ', '1']
            );
        });

        it('with REPLACE, ABSTTL, IDLETIME and FREQ', () => {
            assert.deepEqual(
                transformArguments('key', 0, 'value', {
                    REPLACE: true,
                    ABSTTL: true,
                    IDLETIME: 1,
                    FREQ: 2
                }),
                ['RESTORE', 'key', '0', 'value', 'REPLACE', 'ABSTTL', 'IDLETIME', '1', 'FREQ', '2']
            );
        });
    });

    testUtils.testWithClient('client.restore', async client => {
        const [, dump] = await Promise.all([
            client.set('source', 'value'),
            client.dump(client.commandOptions({ returnBuffers: true }), 'source')
        ]);

        assert.equal(
            await client.restore('destination', 0, dump),
            'OK'
        );
    }, GLOBAL.SERVERS.OPEN);
});
