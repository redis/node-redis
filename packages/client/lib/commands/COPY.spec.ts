import { strict as assert } from 'assert';
import testUtils, { GLOBAL } from '../test-utils';
import { transformArguments, transformReply } from './COPY';

describe('COPY', () => {
    testUtils.isVersionGreaterThanHook([6, 2]);

    describe('transformArguments', () => {
        it('simple', () => {
            assert.deepEqual(
                transformArguments('source', 'destination'),
                ['COPY', 'source', 'destination']
            );
        });

        it('with destination DB flag', () => {
            assert.deepEqual(
                transformArguments('source', 'destination', {
                    destinationDb: 1
                }),
                ['COPY', 'source', 'destination', 'DB', '1']
            );
        });

        it('with replace flag', () => {
            assert.deepEqual(
                transformArguments('source', 'destination', {
                    replace: true
                }),
                ['COPY', 'source', 'destination', 'REPLACE']
            );
        });

        it('with both flags', () => {
            assert.deepEqual(
                transformArguments('source', 'destination', {
                    destinationDb: 1,
                    replace: true
                }),
                ['COPY', 'source', 'destination', 'DB', '1', 'REPLACE']
            );
        });
    });

    describe('transformReply', () => {
        it('0', () => {
            assert.equal(
                transformReply(0),
                false
            );
        });

        it('1', () => {
            assert.equal(
                transformReply(1),
                true
            );
        });
    });

    testUtils.testWithClient('client.copy', async client => {
        assert.equal(
            await client.copy('source', 'destination'),
            false
        );
    }, GLOBAL.SERVERS.OPEN);
});
